import type { ApplicationStatus } from "../db/types";

export type ApplicationNextStatus = Exclude<
  ApplicationStatus,
  "received" | "withdrawn"
>;

export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationNextStatus[]
> = {
  received: ["review", "rejected"],
  review: ["interview", "accepted", "rejected"],
  interview: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export function isApplicationStatusTransitionAllowed(
  from: ApplicationStatus,
  to: ApplicationNextStatus,
): boolean {
  return APPLICATION_STATUS_TRANSITIONS[from].some((status) => status === to);
}
