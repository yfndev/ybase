import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(posthogKey, {
      host: "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
    void posthogClient.register({ app: "ybase" });
    if (process.env.NODE_ENV === "development") {
      posthogClient.debug(true);
    }
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    const client = posthogClient;
    posthogClient = null;
    await client.shutdown();
  }
}
