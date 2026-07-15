import { createTallyClient } from "../../tally/client";
import { isTestMode } from "../../auth/environment";

type TallyEnvironment = {
  [key: string]: string | undefined;
  IS_TEST?: string;
  NODE_ENV?: string;
  TALLY_MASTER_KEY?: string;
  TALLY_API_URL?: string;
};

export function createConfiguredTallyClient(
  env: TallyEnvironment = process.env,
  fetcher: typeof fetch = fetch,
) {
  const apiToken = env.TALLY_MASTER_KEY?.trim();
  if (!apiToken) throw new Error("TALLY_MASTER_KEY is not configured");
  const testApiUrl = isTestMode(env) ? env.TALLY_API_URL?.trim() : undefined;
  return createTallyClient(apiToken, fetcher, testApiUrl);
}
