import { describe, expect, it } from "vitest";
import { memberStatusOptions } from "./memberLabels";

describe("memberStatusOptions", () => {
  it("offers active members every lifecycle status from Vereinsmitglied onward", () => {
    expect(memberStatusOptions("active").map(({ value }) => value)).toEqual([
      "active",
      "offboarding_planned",
      "offboarding",
      "inactive",
      "archived",
    ]);
  });

  it("keeps onboarding available only while it is the current status", () => {
    expect(memberStatusOptions("onboarding").map(({ value }) => value)).toEqual(
      [
        "onboarding",
        "active",
        "offboarding_planned",
        "offboarding",
        "inactive",
        "archived",
      ],
    );
  });
});
