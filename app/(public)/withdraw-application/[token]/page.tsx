import { Button } from "@/components/ui/button";
import { canWithdrawApplication } from "@/lib/server/applications/withdrawal";
import {
  AlertCircle,
  BarChart3,
  ShieldAlert,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bewerbung zurückziehen",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function WithdrawApplicationShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-primary"
      />
      <div className="relative w-full max-w-lg">
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <Image src="/AppIcon.png" alt="" width={36} height={36} priority />
          <span className="text-lg font-bold tracking-tight">YBase</span>
        </div>
        <div className="border bg-card shadow-lg">{children}</div>
      </div>
    </main>
  );
}

export default async function WithdrawApplicationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await canWithdrawApplication(token);

  if (!valid) {
    return (
      <WithdrawApplicationShell>
        <div className="px-6 py-10 text-center sm:px-10">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center bg-destructive/10 text-destructive">
            <AlertCircle aria-hidden="true" className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Link nicht mehr gültig
          </h1>
          <p className="mx-auto mt-3 max-w-sm leading-6 text-muted-foreground">
            Die Bewerbung wurde bereits zurückgezogen oder der Link ist
            ungültig.
          </p>
        </div>
      </WithdrawApplicationShell>
    );
  }

  return (
    <WithdrawApplicationShell>
      <div className="p-6 sm:p-7">
        <div className="flex size-12 items-center justify-center bg-destructive/10 text-destructive">
          <ShieldAlert aria-hidden="true" className="size-6" />
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bewerbung verwalten
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Bewerbung zurückziehen?
          </h1>
          <p className="mt-3 leading-6 text-muted-foreground">
            Deine Bewerbung wird sofort gesperrt. Anschließend passiert
            Folgendes:
          </p>
        </div>

        <div className="mt-5 divide-y border-y">
          <div className="flex gap-4 py-4">
            <Trash2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-destructive"
            />
            <div>
              <p className="font-medium">Persönliche Daten werden gelöscht</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Angaben, Antworten und hochgeladene Dateien werden
                unwiderruflich entfernt.
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-4">
            <BarChart3
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            />
            <div>
              <p className="font-medium">
                Statistikdaten bleiben anonym erhalten
              </p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Diese Daten lassen keine Rückschlüsse auf deine Person zu.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3 bg-muted px-4 py-3">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <p className="text-sm leading-5">
            Dieser Schritt kann nicht rückgängig gemacht werden.
          </p>
        </div>

        <form
          className="mt-5"
          method="post"
          action={`/api/public/applications/withdraw/${encodeURIComponent(token)}`}
        >
          <Button className="h-11 w-full" variant="destructive" type="submit">
            Bewerbung endgültig zurückziehen
          </Button>
        </form>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Wenn du dieses Fenster schließt, bleibt deine Bewerbung unverändert.
        </p>
      </div>
    </WithdrawApplicationShell>
  );
}
