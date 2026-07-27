import { expect, test } from "vitest";
import {
  APPLICATION_STATUS_TRANSITIONS,
  isApplicationStatusTransitionAllowed,
} from "./transitions";

test("moves new applications directly to the interview step", () => {
  expect(APPLICATION_STATUS_TRANSITIONS.received).toEqual([
    "interview",
    "rejected",
  ]);
  expect(isApplicationStatusTransitionAllowed("received", "interview")).toBe(
    true,
  );
  expect(isApplicationStatusTransitionAllowed("received", "review")).toBe(
    false,
  );
});

test("keeps existing applications in review compatible", () => {
  expect(APPLICATION_STATUS_TRANSITIONS.review).toEqual([
    "interview",
    "accepted",
    "rejected",
  ]);
});
