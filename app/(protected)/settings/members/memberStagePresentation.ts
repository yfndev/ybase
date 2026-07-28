import type { MemberStage } from "@/lib/members/stages";

interface EmptyText {
  title: string;
  description: string;
}

export const APPLICATION_STAGE_EMPTY_TEXT: Partial<
  Record<MemberStage, EmptyText>
> = {
  application: {
    title: "Keine offenen Bewerbungen",
    description: "Neue und zu prüfende Bewerbungen erscheinen hier.",
  },
  interview: {
    title: "Keine Interviews geplant",
    description: "Zum Interview eingeladene Bewerber:innen erscheinen hier.",
  },
  onboarding: {
    title: "Niemand im Onboarding",
    description: "Zugesagte und registrierte neue Mitglieder erscheinen hier.",
  },
  archived: {
    title: "Keine archivierten Bewerbungen",
    description: "Abgelehnte und zurückgezogene Bewerbungen erscheinen hier.",
  },
};

export const MEMBER_STAGE_EMPTY_TEXT: Partial<Record<MemberStage, EmptyText>> =
  {
    active: {
      title: "Keine Vereinsmitglieder gefunden",
      description: "Passe Suche oder Filter an, um Mitglieder anzuzeigen.",
    },
    inactive: {
      title: "Keine inaktiven Mitglieder",
      description: "Vorübergehend inaktive Mitglieder erscheinen hier.",
    },
    offboarded: {
      title: "Keine offboardeten Mitglieder",
      description:
        "Ausgetretene und vollständig offboardete Mitglieder erscheinen hier.",
    },
  };
