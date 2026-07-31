"use client";

import {
  ArrowLeft,
  CircleHelp,
  Link2,
  Loader2,
  LogOut,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const suggested = data.profiles.find(({ id }) => id === data.suggestedId);
  const [isSearching, setIsSearching] = useState(!suggested);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("de"));
  const matchingProfiles = data.profiles.filter(({ name }) =>
    name.toLocaleLowerCase("de").includes(deferredQuery),
  );
  const selected = data.profiles.find(({ id }) => id === selectedId);

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
            {isSearching ? (
              <Search aria-hidden="true" className="size-6" />
            ) : (
              <Link2 aria-hidden="true" className="size-6" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isSearching ? "Finde dein Member-Profil" : "Bist das du?"}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {isSearching
              ? "Suche nach deinem Namen und wähle genau dein eigenes Profil aus."
              : "Bestätige dein bestehendes Profil auf der Member-Plattform."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {!isSearching && suggested ? (
            <>
              <MemberPlatformProfileOption profile={suggested} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="primary"
                  disabled={isPending}
                  onClick={() => confirm(suggested.id)}
                >
                  {isPending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : null}
                  Ja, das bin ich
                </Button>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setIsSearching(true)}
                >
                  Anderes Profil wählen
                </Button>
              </div>
            </>
          ) : (
            <>
              {suggested ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearching(false)}
                >
                  <ArrowLeft aria-hidden="true" />
                  Zurück zum Vorschlag
                </Button>
              ) : null}
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Member-Profil suchen"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Vor- oder Nachname"
                  className="pl-11"
                  autoFocus
                />
              </div>

              {matchingProfiles.length > 0 ? (
                <ScrollArea className="h-64 pr-3">
                  <div className="space-y-2">
                    {matchingProfiles.map((profile) => (
                      <MemberPlatformProfileOption
                        key={profile.id}
                        profile={profile}
                        isSelected={profile.id === selectedId}
                        onSelect={() => setSelectedId(profile.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Kein passendes Profil gefunden.
                </p>
              )}

              <Button
                className="w-full"
                variant="primary"
                disabled={!selected || isPending}
                onClick={() => selected && confirm(selected.id)}
              >
                {isPending ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : null}
                Dieses Profil verknüpfen
              </Button>
            </>
          )}

          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CircleHelp
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                Du findest dein Profil nicht oder bist dir unsicher? Bitte wende
                dich an People &amp; Culture, bevor du ein fremdes Profil
                auswählst.
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
