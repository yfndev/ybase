import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApplicationMemberPlatformCandidate } from "@/lib/server/applications/memberPlatformCandidates";
import { formatFieldValue } from "./applicationPresentation";

interface ApplicationAdmissionProfileProps {
  dateOfBirth?: string;
  hasProfile: boolean;
  isEligible: boolean;
  canSync: boolean;
  candidates: ApplicationMemberPlatformCandidate[] | null;
  isPending: boolean;
  isSigned: boolean;
  isSearching: boolean;
  selectingProfileId?: string;
  onSearch: () => void;
  onSelect: (profileId: string) => void;
}

export function ApplicationAdmissionProfile({
  dateOfBirth,
  hasProfile,
  isEligible,
  canSync,
  candidates,
  isPending,
  isSigned,
  isSearching,
  selectingProfileId,
  onSearch,
  onSelect,
}: ApplicationAdmissionProfileProps) {
  if (!hasProfile || !dateOfBirth) {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        {canSync ? (
          <ProfileSearch
            candidates={candidates}
            isPending={isPending}
            isSearching={isSearching}
            selectingProfileId={selectingProfileId}
            onSearch={onSearch}
            onSelect={onSelect}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Geburtsdatum</p>
        <p>{formatFieldValue(dateOfBirth, "INPUT_DATE")}</p>
      </div>
      {isEligible ? (
        <p className="text-sm text-green-700">
          Die Altersvoraussetzung ist erfüllt.
        </p>
      ) : (
        <p className="text-sm text-destructive">
          Bei der Aufnahme muss die Person mindestens 16 und noch nicht 25 Jahre
          alt sein.
        </p>
      )}
      {canSync && !isSigned ? (
        <ProfileSearch
          candidates={candidates}
          isPending={isPending}
          isSearching={isSearching}
          selectingProfileId={selectingProfileId}
          onSearch={onSearch}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}

function ProfileSearch({
  candidates,
  isPending,
  isSearching,
  selectingProfileId,
  onSearch,
  onSelect,
}: {
  candidates: ApplicationMemberPlatformCandidate[] | null;
  isPending: boolean;
  isSearching: boolean;
  selectingProfileId?: string;
  onSearch: () => void;
  onSelect: (profileId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="member"
        className="w-full"
        disabled={isPending}
        aria-busy={isSearching}
        onClick={onSearch}
      >
        <RefreshCw
          aria-hidden="true"
          className={isSearching ? "size-4 animate-spin" : "size-4"}
        />
        {candidates === null ? "Member-Profile suchen" : "Suche aktualisieren"}
      </Button>

      {candidates === null ? null : candidates.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Passendes Profil auswählen
          </legend>
          <ul className="space-y-2">
            {candidates.map((candidate) => (
              <li key={candidate.id}>
                <Button
                  type="button"
                  variant="outline"
                  size="member"
                  className="h-auto w-full justify-start whitespace-normal px-4 text-left"
                  disabled={isPending}
                  aria-label={`${candidate.name} als Member-Profil zuordnen`}
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
                  ) : null}
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm text-muted-foreground">
          Kein aktives Member-Profil gefunden. Vor der Aufnahme muss die Person
          eines erstellen.
        </p>
      )}
    </div>
  );
}
