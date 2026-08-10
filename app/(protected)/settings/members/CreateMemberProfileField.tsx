"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationAdmissionProfileSearch } from "@/components/Applications/ApplicationAdmissionProfileSearch";
import { useManualMemberPlatformProfiles } from "@/lib/client/members/hooks/useManualMemberPlatformProfiles";

interface Props {
  name: string;
  privateEmail: string;
  selectedProfileId: string;
  disabled: boolean;
  onSelect: (profileId: string) => void;
}

export function CreateMemberProfileField({
  name,
  privateEmail,
  selectedProfileId,
  disabled,
  onSelect,
}: Props) {
  const profiles = useManualMemberPlatformProfiles({ name, privateEmail });
  const canSearch = name.trim().length >= 2 && privateEmail.includes("@");

  return (
    <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Member-Profil*</h3>
        <p className="text-xs text-muted-foreground">
          Suche über den Namen und die private E-Mail-Adresse nach dem bereits
          bestätigten Profil.
        </p>
      </div>

      {profiles.candidates === null &&
      !profiles.isSearching &&
      !profiles.isError ? (
        <Button
          type="button"
          variant="outline"
          size="member"
          className="w-full"
          disabled={disabled || profiles.isPending || !canSearch}
          onClick={profiles.search}
        >
          <Search aria-hidden="true" className="size-4" />
          Member-Profil suchen
        </Button>
      ) : (
        <ApplicationAdmissionProfileSearch
          candidates={profiles.candidates}
          isPending={disabled || profiles.isPending}
          isSearching={profiles.isSearching}
          searchError={profiles.isError}
          selectedProfileId={selectedProfileId || undefined}
          onSearch={profiles.search}
          onSelect={onSelect}
        />
      )}
    </section>
  );
}
