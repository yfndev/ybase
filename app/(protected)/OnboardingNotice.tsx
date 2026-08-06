"use client";

import { LogOut, UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutWithPostHog } from "@/lib/posthog-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OnboardingNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRoundSearch aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="text-2xl">
            Member-Profil noch nicht verknüpft
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Dein YBase-Konto ist angelegt, aber noch keinem Profil in der
            Member-Plattform zugeordnet. Ohne diese Zuordnung können deine
            Unterlagen nicht bereitgestellt werden.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="border-t pt-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Bitte wende dich an People &amp; Culture, damit dein Member-Profil
              angelegt und verknüpft wird. Danach kannst du deine Unterlagen und
              den Mitgliedsantrag direkt hier abschließen.
            </p>
            <Button variant="outline" onClick={() => void signOutWithPostHog()}>
              <LogOut aria-hidden="true" />
              Abmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
