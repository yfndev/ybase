import { CheckCircle2 } from "lucide-react";
import type { ApplicationMemberPlatformCandidate } from "@/lib/server/applications/memberPlatformCandidates";
import { ApplicationAdmissionProfileSearch } from "./ApplicationAdmissionProfileSearch";
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
  searchError: boolean;
  selectedProfileId?: string;
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
  searchError,
  selectedProfileId,
  selectingProfileId,
  onSearch,
  onSelect,
}: ApplicationAdmissionProfileProps) {
  if (!hasProfile || !dateOfBirth) {
    return canSync ? (
      <ApplicationAdmissionProfileSearch
        candidates={candidates}
        isPending={isPending}
        isSearching={isSearching}
        searchError={searchError}
        selectedProfileId={selectedProfileId}
        selectingProfileId={selectingProfileId}
        onSearch={onSearch}
        onSelect={onSelect}
      />
    ) : null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 border-y py-3">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Member-Profil zugeordnet
        </p>
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Geburtsdatum</span>
          <span>{formatFieldValue(dateOfBirth, "INPUT_DATE")}</span>
        </div>
      </div>
      {!isEligible ? (
        <p className="text-sm text-destructive">
          Bei der Aufnahme muss die Person mindestens 16 und noch nicht 25 Jahre
          alt sein.
        </p>
      ) : null}
      {canSync && !isSigned ? (
        <ApplicationAdmissionProfileSearch
          candidates={candidates}
          isPending={isPending}
          isSearching={isSearching}
          searchError={searchError}
          selectedProfileId={selectedProfileId}
          selectingProfileId={selectingProfileId}
          onSearch={onSearch}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}
