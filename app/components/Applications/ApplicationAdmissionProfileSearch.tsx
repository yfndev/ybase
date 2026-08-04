import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationMemberPlatformCandidate } from "@/lib/server/applications/memberPlatformCandidates";
import { cn } from "@/lib/utils";
import { formatFieldValue } from "./applicationPresentation";

const PROFILE_SKELETON_ROWS = ["first", "second"];

interface ApplicationAdmissionProfileSearchProps {
  candidates: ApplicationMemberPlatformCandidate[] | null;
  isPending: boolean;
  isSearching: boolean;
  searchError: boolean;
  selectedProfileId?: string;
  selectingProfileId?: string;
  onSearch: () => void;
  onSelect: (profileId: string) => void;
}

export function ApplicationAdmissionProfileSearch({
  candidates,
  isPending,
  isSearching,
  searchError,
  selectedProfileId,
  selectingProfileId,
  onSearch,
  onSelect,
}: ApplicationAdmissionProfileSearchProps) {
  if (candidates === null) {
    if (isSearching) {
      return (
        <div className="space-y-3" aria-busy="true">
          <span className="sr-only">Member-Profile werden gesucht</span>
          <div aria-hidden="true" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="divide-y border-y">
              {PROFILE_SKELETON_ROWS.map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-4 px-2 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44 max-w-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (!searchError) return null;

    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          Member-Profile konnten nicht geladen werden.
        </p>
        <Button
          type="button"
          variant="outline"
          size="member"
          className="w-full"
          disabled={isPending}
          onClick={onSearch}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {candidates.length > 0
            ? selectedProfileId
              ? "Member-Profil ändern"
              : "Passendes Profil auswählen"
            : "Keine Treffer"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-busy={isSearching}
          onClick={onSearch}
        >
          <RefreshCw
            aria-hidden="true"
            className={isSearching ? "size-3.5 animate-spin" : "size-3.5"}
          />
          Aktualisieren
        </Button>
      </div>

      {candidates.length > 0 ? (
        <ul className="divide-y border-y">
          {candidates.map((candidate) => {
            const isSelected = candidate.id === selectedProfileId;
            return (
              <li key={candidate.id}>
                <Button
                  type="button"
                  variant="ghost"
                  size="member"
                  className={cn(
                    "h-auto w-full justify-between whitespace-normal rounded-none px-2 py-3 text-left",
                    isSelected && "disabled:opacity-100",
                  )}
                  disabled={isPending || isSelected}
                  aria-label={
                    isSelected
                      ? `${candidate.name} ist als Member-Profil zugeordnet`
                      : `${candidate.name} als Member-Profil zuordnen`
                  }
                  onClick={() => onSelect(candidate.id)}
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                    <span className="font-semibold">{candidate.name}</span>
                    {candidate.email ? (
                      <span className="break-all text-xs font-normal text-muted-foreground">
                        {candidate.email}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal text-muted-foreground">
                      Geburtsdatum:{" "}
                      {formatFieldValue(candidate.dateOfBirth, "INPUT_DATE")}
                    </span>
                  </span>
                  {selectingProfileId === candidate.id ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : isSelected ? (
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      Zugeordnet
                    </span>
                  ) : (
                    <span className="text-sm font-semibold">Zuordnen</span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Kein aktives Member-Profil gefunden. Vor der Aufnahme muss die Person
          eines erstellen.
        </p>
      )}
    </div>
  );
}
