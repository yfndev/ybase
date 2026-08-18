import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/memberships/guardianResignation", () => ({
  confirmGuardianResignation: vi.fn(),
}));

import { confirmGuardianResignation } from "@/lib/server/memberships/guardianResignation";
import { POST } from "./route";

const confirmResignation = vi.mocked(confirmGuardianResignation);

describe("POST /api/public/membership/resignation/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000/");
    vi.stubEnv("AUTH_URL", "http://auth.example");
  });

  it("redirects to success after the guardian confirms", async () => {
    const response = await POST(
      new Request(
        "http://0.0.0.0:3000/api/public/membership/resignation/token",
      ),
      { params: Promise.resolve({ token: "token" }) },
    );

    expect(confirmResignation).toHaveBeenCalledWith("token");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/membership/resignation/success",
    );
  });

  it("returns to the configured app host when confirmation fails", async () => {
    confirmResignation.mockRejectedValueOnce(new Error("invalid token"));

    const response = await POST(
      new Request(
        "http://0.0.0.0:3000/api/public/membership/resignation/token",
      ),
      { params: Promise.resolve({ token: "token" }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/membership/resignation/token?error=1",
    );
  });
});
