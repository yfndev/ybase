import type { MemberStatus, TeamOnboardingStatus } from "@/lib/db/types";
import { LabeledSelect } from "./LabeledSelect";
import { memberStatusOptions } from "./memberLabels";

interface Props {
  status: MemberStatus;
  onboarding: TeamOnboardingStatus;
  onChange: (status: MemberStatus) => void;
}

export function MemberStatusField({ status, onboarding, onChange }: Props) {
  const isApprovalAllowed = onboarding === "completed" || status === "active";
  const options = memberStatusOptions(status).map((option) => ({
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
        !isApprovalAllowed
          ? "Die Aktivierung ist erst möglich, wenn alle Onboarding-Aufgaben abgeschlossen sind."
          : undefined
      }
    />
  );
}
