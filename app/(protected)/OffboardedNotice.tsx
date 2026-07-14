"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function OffboardedNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Kein Zugriff mehr</h1>
        <p className="text-muted-foreground text-sm">
          Dein Zugang wurde beendet. Bitte wende dich an People &amp; Culture,
          wenn das ein Fehler ist.
        </p>
        <Button
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Abmelden
        </Button>
      </div>
    </div>
  );
}
