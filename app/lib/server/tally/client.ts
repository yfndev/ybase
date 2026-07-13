import { createTallyClient } from "../../tally/client";

type TallyEnvironment = {
  [key: string]: string | undefined;
  TALLY_MASTER_KEY?: string;
};

export function createConfiguredTallyClient(
  env: TallyEnvironment = process.env,
  fetcher: typeof fetch = fetch,
) {
  const apiToken = env.TALLY_MASTER_KEY?.trim();
  if (!apiToken) throw new Error("TALLY_MASTER_KEY is not configured");
  return createTallyClient(apiToken, fetcher);
}
