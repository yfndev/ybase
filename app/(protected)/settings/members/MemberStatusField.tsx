import { MemberStageIcon } from "@/components/Members/MemberStageIcon";
import type { MemberStatus, TeamOnboardingStatus } from "@/lib/db/types";
import { memberStageForStatus } from "@/lib/members/stages";
import { LabeledSelect } from "./LabeledSelect";
import { memberStatusOptions } from "./memberLabels";

const STATUS_HINTS: Partial<Record<MemberStatus, string>> = {
  offboarding_planned:
    "Interne Vormerkung: Die Person bleibt aktiv und wird darüber noch nicht informiert.",
  offboarding:
    "Das Gespräch hat stattgefunden. Der ybase-Zugriff wird gesperrt, während People & Culture Zugänge entfernt.",
  archived: "Das Offboarding ist vollständig abgeschlossen.",
};

interface Props {
  status: MemberStatus;
  onboarding: TeamOnboardingStatus;
  onChange: (status: MemberStatus) => void;
}

export function MemberStatusField({ status, onboarding, onChange }: Props) {
  const isApprovalAllowed = onboarding === "completed" || status === "active";
  const options = memberStatusOptions(status).map((option) => ({
    ...option,
    icon: <MemberStageIcon stage={memberStageForStatus(option.value)} />,
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
          : STATUS_HINTS[status]
      }
    />
  );
}
