import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function MembershipSummaryCard({
  membership,
}: {
  membership: OwnMembershipOverview;
}) {
  const status = membershipStatus(membership);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deine Mitgliedschaft</CardTitle>
        <CardDescription className="space-y-0.5">
          <p>Young Founders Network e.V.</p>
          <p>{membership.memberName}</p>
        </CardDescription>
        <CardAction>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-5 sm:grid-cols-3">
          <MembershipDetail
            label="Mitgliedsnummer"
            value={membership.membershipNumber}
          />
          <MembershipDetail
            label="Mitglied seit"
            value={DATE_FORMAT.format(membership.admittedAt)}
          />
          {membership.scheduledEndAt ? (
            <MembershipDetail
              label="Vorgemerktes Ende"
              value={formatEndDate(membership.scheduledEndAt)}
            />
          ) : (
            <MembershipDetail label="Mitgliedschaft" value="Unbefristet" />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function MembershipDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function membershipStatus(membership: OwnMembershipOverview): {
  label: string;
  variant: "primary" | "secondary" | "outline";
} {
  if (membership.legalStatus === "resigning") {
    return { label: "Ende vorgemerkt", variant: "secondary" };
  }
  if (membership.legalStatus === "active") {
    return { label: "Aktiv", variant: "primary" };
  }
  if (membership.legalStatus === "suspended") {
    return { label: "Ruhend", variant: "outline" };
  }
  return { label: "Beendet", variant: "outline" };
}

function formatEndDate(scheduledEndAt: number) {
  return DATE_FORMAT.format(scheduledEndAt - 1);
}
