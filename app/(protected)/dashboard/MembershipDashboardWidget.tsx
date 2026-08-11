import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function MembershipDashboardWidget({
  membership,
}: {
  membership: OwnMembershipOverview | null;
}) {
  const presentation = membershipPresentation(membership);
  const card = (
    <Card className={membership ? "h-full hover:border-ring" : "h-full"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${presentation.dot}`}
          />
          Mitgliedschaft
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{presentation.label}</div>
        <p
          className="truncate text-sm text-muted-foreground"
          title={presentation.detail}
        >
          {presentation.detail}
        </p>
      </CardContent>
    </Card>
  );

  if (!membership) return card;
  return (
    <Link
      href="/membership"
      aria-label="Eigene Mitgliedschaft anzeigen und verwalten"
      className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {card}
    </Link>
  );
}

function membershipPresentation(membership: OwnMembershipOverview | null) {
  if (!membership) {
    return {
      label: "Nicht zugeordnet",
      detail: "Keine Mitgliedschaft gefunden",
      dot: "bg-muted-foreground",
    };
  }
  if (membership.legalStatus === "resigning") {
    return {
      label: "Ende vorgemerkt",
      detail: membership.scheduledEndAt
        ? `Ende ${formatEndDate(membership.scheduledEndAt)}`
        : membership.membershipNumber,
      dot: "bg-amber-500",
    };
  }
  if (membership.legalStatus === "active") {
    return {
      label: "Aktiv",
      detail: `Mitglied seit ${DATE_FORMAT.format(membership.admittedAt)}`,
      dot: "bg-emerald-500",
    };
  }
  return {
    label: membership.legalStatus === "suspended" ? "Ruhend" : "Beendet",
    detail: membership.membershipNumber,
    dot: "bg-muted-foreground",
  };
}

function formatEndDate(scheduledEndAt: number) {
  return DATE_FORMAT.format(scheduledEndAt - 1);
}
