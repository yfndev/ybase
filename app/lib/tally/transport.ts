import { tallyApiError } from "./apiError";
import { TALLY_API_VERSION } from "./constants";

export const TALLY_API_URL = "https://api.tally.so";

export function createTallyRequest(
  apiToken: string,
  fetcher: typeof fetch,
  apiUrl: string,
) {
  return async function request(
    path: string,
    init?: { method: string; body?: unknown },
    ignoreNotFound = false,
  ): Promise<unknown> {
    const hasBody = init?.body !== undefined;
    const response = await fetcher(`${apiUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
        "tally-version": TALLY_API_VERSION,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (ignoreNotFound && response.status === 404) return {};
    if (!response.ok) throw await tallyApiError(response);
    if (response.status === 204) return {};
    return response.json();
  };
}
