import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bewerbung zurückgezogen",
  robots: { index: false, follow: false },
};

export default function ApplicationWithdrawnPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-4 size-12 text-emerald-600" />
        <h1 className="text-2xl font-semibold">Bewerbung zurückgezogen</h1>
        <p className="mt-2 text-muted-foreground">
          Deine personenbezogenen Bewerbungsdaten wurden entfernt. Du kannst
          dieses Fenster jetzt schließen.
        </p>
      </div>
    </main>
  );
}
