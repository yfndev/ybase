import { after } from "next/server";

const REQUEST_TIMEOUT_MS = 3_000;
const RETRY_DELAYS_MS = [0, 250, 1_000] as const;

export function scheduleTeamDirectoryRevalidation(): void {
  const url = process.env.YFN_LANDING_REVALIDATE_URL;
  const secret = process.env.YFN_LANDING_REVALIDATE_SECRET;
  if (!url || !secret) return;

  after(async () => {
    await notifyTeamDirectoryChanged(url, secret);
  });
}

async function notifyTeamDirectoryChanged(
  url: string,
  secret: string,
): Promise<void> {
  for (const [attempt, delayMs] of RETRY_DELAYS_MS.entries()) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return;
      if (response.status < 500 || attempt === RETRY_DELAYS_MS.length - 1) {
        console.error(
          `Landing team directory revalidation returned ${response.status}`,
        );
        return;
      }
    } catch (error) {
      if (attempt === RETRY_DELAYS_MS.length - 1) {
        console.error("Landing team directory revalidation failed", error);
      }
    }
  }
}
