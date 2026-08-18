import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGuardianResignationRequest } from "@/lib/server/memberships/guardianResignation";
import { GUARDIAN_RESIGNATION_CONSENT_TEXT } from "@/lib/server/memberships/resignationDeclaration";
import { ResignationShell } from "../ResignationShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Austritt bestätigen",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function GuardianResignationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const request = await getGuardianResignationRequest(token);

  if (!request) {
    return (
      <ResignationShell>
        <Card>
          <CardHeader className="text-center">
            <AlertCircle
              aria-hidden="true"
              className="mx-auto size-8 text-destructive"
            />
            <CardTitle>Link nicht mehr gültig</CardTitle>
            <CardDescription>
              Der Austritt wurde bereits bestätigt oder der Link ist abgelaufen.
            </CardDescription>
          </CardHeader>
        </Card>
      </ResignationShell>
    );
  }

  return (
    <ResignationShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Austritt bestätigen</CardTitle>
          <CardDescription className="leading-6">
            {request.memberName} möchte die Mitgliedschaft im Young Founders
            Network e.V. beenden. Bitte bestätige den Austritt als gesetzliche
            Vertretung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              Die Bestätigung konnte nicht verarbeitet werden. Bitte versuche es
              erneut.
            </p>
          ) : null}
          <p className="rounded-md border bg-muted/30 p-4 leading-6">
            {request.declarationText}
          </p>
          <div className="space-y-1 text-muted-foreground">
            <p>
              Voraussichtliches Ende: {formatEndDate(request.expectedEndAt)}
            </p>
            <p>Link gültig bis: {DATE_FORMAT.format(request.expiresAt)}</p>
          </div>
          <p className="font-medium">{GUARDIAN_RESIGNATION_CONSENT_TEXT}</p>
        </CardContent>
        <CardFooter>
          <form
            className="w-full"
            method="post"
            action={`/api/public/membership/resignation/${encodeURIComponent(token)}`}
          >
            <Button
              className="w-full"
              variant="primary"
              size="lg"
              type="submit"
            >
              Austritt verbindlich bestätigen
            </Button>
          </form>
        </CardFooter>
      </Card>
    </ResignationShell>
  );
}

function formatEndDate(scheduledEndAt: number) {
  return DATE_FORMAT.format(scheduledEndAt - 1);
}
