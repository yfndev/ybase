"use client";

import { ApplicationAdmissionProfileSearch } from "@/components/Applications/ApplicationAdmissionProfileSearch";
import { useManualMemberPlatformProfiles } from "@/lib/client/members/hooks/useManualMemberPlatformProfiles";

interface Props {
  name: string;
  selectedProfileId: string;
  disabled: boolean;
  onSelect: (profileId: string) => void;
}

export function CreateMemberProfileField({
  name,
  selectedProfileId,
  disabled,
  onSelect,
}: Props) {
  const profiles = useManualMemberPlatformProfiles(name);
  const canSearch = name.trim().length >= 2;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Member-Profil*</h3>

      {!canSearch ? (
        <p className="text-sm text-muted-foreground">
          Gib mindestens zwei Zeichen ein, um Member-Profile zu suchen.
        </p>
      ) : (
        <ApplicationAdmissionProfileSearch
          candidates={profiles.candidates}
          isPending={disabled || profiles.isSearching}
          isSearching={profiles.isSearching}
          searchError={profiles.isError}
          selectedProfileId={selectedProfileId || undefined}
          onSearch={() => void profiles.refetch()}
          onSelect={onSelect}
        />
      )}
    </section>
  );
}
