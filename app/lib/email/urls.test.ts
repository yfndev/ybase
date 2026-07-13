import { describe, expect, it } from "vitest";
import { appUrl } from "./urls";

describe("appUrl", () => {
  it("builds links from NEXT_PUBLIC_APP_URL without duplicate slashes", () => {
    expect(
      appUrl("/reimbursements/123", {
        NEXT_PUBLIC_APP_URL: "https://ybase.test/",
      }),
    ).toBe("https://ybase.test/reimbursements/123");
  });

  it("requires a configured application URL", () => {
    expect(() => appUrl("/reimbursements", {})).toThrow(
      "NEXT_PUBLIC_APP_URL is required for transactional email links",
    );
  });
});
