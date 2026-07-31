import type { MemberStatus, MembershipEndReason } from "../db/types";

export type TerminalMemberStatus = Extract<
  MemberStatus,
  "archived" | "excluded"
>;

export function terminalMemberStatus(
  endReason: MembershipEndReason,
): TerminalMemberStatus {
  return endReason === "exclusion" ? "excluded" : "archived";
}
