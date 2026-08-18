import type { GettingToKnowPhase, StoredMemberStatus } from "../db/types";

interface PhaseMember {
  memberStatus: StoredMemberStatus;
  gettingToKnow?: GettingToKnowPhase;
}

export function isInGettingToKnow(member: PhaseMember): boolean {
  return member.memberStatus === "getting_to_know";
}

export function isGettingToKnowConfirmed(member: PhaseMember): boolean {
  return (
    member.memberStatus === "getting_to_know" &&
    member.gettingToKnow?.outcome === "confirmed"
  );
}
