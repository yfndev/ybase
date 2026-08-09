"use client";

import { Button } from "@/components/ui/button";
import { signOutWithPostHog } from "@/lib/posthog-client";

export function OffboardedNotice({
  isAccountDeleted = false,
}: {
  isAccountDeleted?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          {isAccountDeleted ? "Account gelöscht" : "Mitgliedsprofil gesperrt"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAccountDeleted
            ? "Dein Google Workspace-Konto wurde gelöscht. Du hast keinen Zugriff mehr auf YBase."
            : "Dein Account bleibt vorerst bestehen, hat aber keinen Zugriff auf YBase."}{" "}
          Bitte wende dich an People &amp; Culture, wenn das ein Fehler ist.
        </p>
        <Button className="w-full" onClick={() => void signOutWithPostHog()}>
          Abmelden
        </Button>
      </div>
    </div>
  );
}
