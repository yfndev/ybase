import type { ApplicationStatus } from "../db/types";

export type ApplicationNextStatus = Exclude<ApplicationStatus, "received">;

export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationNextStatus[]
> = {
  received: ["review", "rejected", "withdrawn"],
  review: ["interview", "accepted", "rejected", "withdrawn"],
  interview: ["accepted", "rejected", "withdrawn"],
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
