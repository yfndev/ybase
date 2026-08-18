import { describe, expect, test } from "vitest";
import {
  isPublicMemberStatus,
  isUnavailableMemberStatus,
  normalizeMemberStatus,
  PUBLIC_MEMBER_STATUSES,
} from "./status";

describe("member status semantics", () => {
  test("keeps planned offboarding members publicly active", () => {
    expect(PUBLIC_MEMBER_STATUSES).toContain("offboarding_planned");
    expect(isPublicMemberStatus("offboarding_planned")).toBe(true);
    expect(isUnavailableMemberStatus("offboarding_planned")).toBe(false);
  });

  test.each(["offboarding", "archived", "excluded", "offboarded"] as const)(
    "treats %s members as unavailable",
    (status) => {
      expect(isUnavailableMemberStatus(status)).toBe(true);
    },
  );

  test("normalizes the legacy terminal status to archived", () => {
    expect(normalizeMemberStatus("offboarded")).toBe("archived");
    expect(normalizeMemberStatus("active")).toBe("active");
  });
});
