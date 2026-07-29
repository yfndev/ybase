import { expect, test } from "vitest";
import { jobPostingUrgency } from "./urgency";

test("treats legacy job postings without urgency as normal", () => {
  expect(jobPostingUrgency()).toBe("normal");
});

test("keeps an explicitly stored urgency", () => {
  expect(jobPostingUrgency("urgent")).toBe("urgent");
});
