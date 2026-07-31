"use client";

import { CircleHelp, Link2, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutWithPostHog } from "@/lib/posthog-client";
import { confirmMemberPlatformProfile } from "@/lib/server/memberPlatform/actions";
import type { MemberPlatformLinkingData } from "@/lib/server/memberPlatform/linking";
import { MemberPlatformProfileOption } from "./MemberPlatformProfileOption";

export function MemberPlatformLinking({
  data,
}: {
  data: MemberPlatformLinkingData;
}) {
  const router = useRouter();
  const profile = data.profile;
  const [isPending, startTransition] = useTransition();

  const confirm = (profileId: string) => {
    startTransition(async () => {
      try {
        await confirmMemberPlatformProfile(profileId);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Das Profil konnte nicht verknüpft werden.",
        );
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Link2 aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="text-2xl">
            {profile
              ? "Bist das du?"
              : "Profil konnte nicht sicher zugeordnet werden"}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {profile
              ? "Bestätige dein bestehendes Profil auf der Member-Plattform."
              : "People & Culture muss die Zuordnung prüfen, bevor dein Onboarding weitergehen kann."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {profile ? (
            <>
              <MemberPlatformProfileOption profile={profile} />
              <Button
                className="w-full"
                variant="primary"
                disabled={isPending}
                aria-busy={isPending}
                onClick={() => confirm(profile.id)}
              >
                {isPending ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : null}
                Ja, das bin ich
              </Button>
            </>
          ) : null}

          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CircleHelp
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                Ist das nicht dein Profil oder fehlt der Vorschlag? Bitte wende
                dich an People &amp; Culture.
              </span>
            </p>
          </div>

          <Button
            className="w-full"
            variant="ghost"
            disabled={isPending}
            onClick={() => void signOutWithPostHog()}
          >
            <LogOut aria-hidden="true" />
            Abmelden
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
