import { expect, test, vi } from "vitest";
import { TALLY_API_VERSION } from "../../tally/constants";
import { createConfiguredTallyClient } from "./client";

function json(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200 });
}

test("loads the Tally API token exclusively from the server environment", async () => {
  const fetcher = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      json({ items: [], hasMore: false }),
  );
  const client = createConfiguredTallyClient(
    { TALLY_MASTER_KEY: "  token-from-env  " },
    fetcher as unknown as typeof fetch,
  );

  await client.resources();

  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const call of fetcher.mock.calls) {
    const headers = new Headers(call[1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer token-from-env");
    expect(headers.get("tally-version")).toBe(TALLY_API_VERSION);
  }
});

test("rejects a missing Tally API token", () => {
  expect(() => createConfiguredTallyClient({})).toThrow(
    "TALLY_MASTER_KEY is not configured",
  );
});

test("uses a custom API URL only in test mode", async () => {
  const fetcher = vi.fn(async () => json({ items: [], hasMore: false }));
  const client = createConfiguredTallyClient(
    {
      IS_TEST: "true",
      NODE_ENV: "test",
      TALLY_API_URL: "http://localhost:3000/api/test/tally",
      TALLY_MASTER_KEY: "test-token",
    },
    fetcher as unknown as typeof fetch,
  );

  await client.resources();

  expect(fetcher).toHaveBeenCalledWith(
    expect.stringMatching(/^http:\/\/localhost:3000\/api\/test\/tally\//),
    expect.any(Object),
  );
});
