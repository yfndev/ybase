import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canWithdrawApplication } from "@/lib/server/applications/withdrawal";
import { AlertCircle } from "lucide-react";
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
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Image src="/AppIcon.png" alt="" width={40} height={40} priority />
          <span className="text-xl font-bold">YBase</span>
        </div>
        {children}
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
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center text-destructive">
              <AlertCircle aria-hidden="true" className="size-7" />
            </div>
            <CardTitle>Link nicht mehr gültig</CardTitle>
            <CardDescription>
              Die Bewerbung wurde bereits zurückgezogen oder der Link ist
              ungültig.
            </CardDescription>
          </CardHeader>
        </Card>
      </WithdrawApplicationShell>
    );
  }

  return (
    <WithdrawApplicationShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bewerbung zurückziehen?</CardTitle>
          <CardDescription className="text-sm leading-6">
            Deine persönlichen Daten, Antworten und hochgeladenen Dateien werden
            gelöscht. Anonyme Statistikdaten bleiben erhalten. Dieser Schritt
            kann nicht rückgängig gemacht werden.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <form
            className="w-full"
            method="post"
            action={`/api/public/applications/withdraw/${encodeURIComponent(token)}`}
          >
            <Button
              className="w-full"
              variant="primary"
              size="lg"
              type="submit"
            >
              Bewerbung endgültig zurückziehen
            </Button>
          </form>
        </CardFooter>
      </Card>
    </WithdrawApplicationShell>
  );
}
