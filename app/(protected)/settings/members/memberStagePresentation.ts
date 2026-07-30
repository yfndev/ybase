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
};

export const MEMBER_STAGE_EMPTY_TEXT: Partial<Record<MemberStage, EmptyText>> =
  {
    onboarding: {
      title: "Niemand im Onboarding",
      description: "Neue Mitglieder im Onboarding erscheinen hier.",
    },
    active: {
      title: "Keine Vereinsmitglieder gefunden",
      description: "Passe Suche oder Filter an, um Mitglieder anzuzeigen.",
    },
    offboarding_planned: {
      title: "Kein Offboarding vorgemerkt",
      description:
        "Intern für ein kommendes Offboarding vorgemerkte Mitglieder erscheinen hier.",
    },
    offboarding: {
      title: "Kein laufendes Offboarding",
      description:
        "Mitglieder im offiziellen Offboarding-Prozess erscheinen hier.",
    },
    archived: {
      title: "Keine archivierten Mitglieder",
      description: "Vollständig offboardete Mitglieder erscheinen hier.",
    },
    excluded: {
      title: "Keine ausgeschlossenen Personen",
      description:
        "Aus dem Team ausgeschlossene Personen erscheinen zentral in dieser Liste.",
    },
  };
