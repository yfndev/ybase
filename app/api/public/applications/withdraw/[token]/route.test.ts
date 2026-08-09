import { beforeEach, describe, expect, it, vi } from "vitest";
import { withdrawApplicationByToken } from "@/lib/server/applications/withdrawal";
import { POST } from "./route";

vi.mock("@/lib/server/applications/withdrawal", () => ({
  withdrawApplicationByToken: vi.fn(),
}));

const withdrawApplication = vi.mocked(withdrawApplicationByToken);

describe("POST /api/public/applications/withdraw/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000/");
    vi.stubEnv("AUTH_URL", "http://auth.example");
  });

  it("redirects to the configured app host after withdrawal", async () => {
    const response = await POST(
      new Request("http://0.0.0.0:3000/api/public/applications/withdraw/token"),
      { params: Promise.resolve({ token: "token" }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/withdraw-application/success",
    );
  });

  it("uses the configured app host for invalid links too", async () => {
    withdrawApplication.mockRejectedValueOnce(new Error("invalid token"));

    const response = await POST(
      new Request("http://0.0.0.0:3000/api/public/applications/withdraw/token"),
      { params: Promise.resolve({ token: "token" }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/withdraw-application/invalid",
    );
  });
});
