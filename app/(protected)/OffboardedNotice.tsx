"use client";

import { Button } from "@/components/ui/button";
import { signOutWithPostHog } from "@/lib/posthog-client";

export function OffboardedNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Mitgliedsprofil inaktiv</h1>
        <p className="text-muted-foreground text-sm">
          Dein Account bleibt vorerst bestehen, hat aber keinen Zugriff auf
          ybase. Bitte wende dich an People &amp; Culture, wenn das ein Fehler
          ist.
        </p>
        <Button className="w-full" onClick={() => void signOutWithPostHog()}>
          Abmelden
        </Button>
      </div>
    </div>
  );
}
