import { Button } from "@/components/ui/button";
import { canWithdrawApplication } from "@/lib/server/applications/withdrawal";
import { AlertCircle, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bewerbung zurückziehen",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function WithdrawApplicationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await canWithdrawApplication(token);

  if (!valid) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
          <h1 className="text-2xl font-semibold">Link nicht mehr gültig</h1>
          <p className="mt-2 text-muted-foreground">
            Die Bewerbung wurde bereits zurückgezogen oder der Link ist
            ungültig.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <ShieldCheck className="mb-4 size-10 text-primary" />
        <h1 className="text-2xl font-semibold">Bewerbung zurückziehen?</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Deine Bewerbung wird sofort gesperrt. Persönliche Angaben, Antworten
          und hochgeladene Dateien werden unwiderruflich gelöscht; erhalten
          bleiben nur anonyme Statistikdaten.
        </p>
        <form
          className="mt-6"
          method="post"
          action={`/api/public/applications/withdraw/${encodeURIComponent(token)}`}
        >
          <Button className="w-full" variant="destructive" type="submit">
            Bewerbung endgültig zurückziehen
          </Button>
        </form>
      </div>
    </main>
  );
}
