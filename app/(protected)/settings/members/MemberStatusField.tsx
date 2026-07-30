import type { MemberStatus, TeamOnboardingStatus } from "@/lib/db/types";
import { LabeledSelect } from "./LabeledSelect";
import { memberStatusOptions } from "./memberLabels";

interface Props {
  status: MemberStatus;
  onboarding: TeamOnboardingStatus;
  infractionCount: number;
  onChange: (status: MemberStatus) => void;
}

export function MemberStatusField({
  status,
  onboarding,
  infractionCount,
  onChange,
}: Props) {
  const hasReachedInfractionLimit = infractionCount >= 2;
  const isApprovalAllowed =
    !hasReachedInfractionLimit &&
    (onboarding === "completed" || status === "active");
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
        hasReachedInfractionLimit
          ? "Mitglieder mit zwei Verstößen können nicht erneut aktiviert werden."
          : undefined
      }
    />
  );
}
