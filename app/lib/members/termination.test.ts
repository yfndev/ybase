import { describe, expect, test } from "vitest";
import { terminalMemberStatus } from "./termination";

describe("terminal member status", () => {
  test.each(["resignation", "age_limit", "death"] as const)(
    "archives a membership ended by %s",
    (endReason) => {
      expect(terminalMemberStatus(endReason)).toBe("archived");
    },
  );

  test("reserves excluded for a formal exclusion", () => {
    expect(terminalMemberStatus("exclusion")).toBe("excluded");
  });
});
