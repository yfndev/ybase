import type { MemberStatus, TeamOnboardingStatus } from "@/lib/db/types";
import { LabeledSelect } from "./LabeledSelect";
import { MEMBER_STATUS_OPTIONS } from "./memberLabels";

interface Props {
  status: MemberStatus;
  onboarding: TeamOnboardingStatus;
  onChange: (status: MemberStatus) => void;
}

export function MemberStatusField({ status, onboarding, onChange }: Props) {
  const isApprovalAllowed = onboarding === "completed" || status === "active";
  const options = MEMBER_STATUS_OPTIONS.map((option) => ({
    ...option,
    disabled: option.value === "active" && !isApprovalAllowed,
  }));

  return (
    <LabeledSelect
      id="member-status"
      label="Mitgliedsstatus"
      value={status}
      onValueChange={(value) => onChange(value as MemberStatus)}
      options={options}
      hint={
        isApprovalAllowed
          ? undefined
          : "Die Freigabe ist erst möglich, wenn alle Onboarding-Aufgaben abgeschlossen sind."
      }
    />
  );
}
