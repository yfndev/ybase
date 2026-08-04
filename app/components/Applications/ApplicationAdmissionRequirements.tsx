"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApplicationMemberPlatformProfiles } from "@/lib/client/applications/hooks/useApplicationMemberPlatformProfiles";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { ageOnDate } from "@/lib/members/legalDates";
import { ApplicationAdmissionProfile } from "./ApplicationAdmissionProfile";
import { DATE_TIME_FORMAT } from "./applicationPresentation";

const EDITABLE_STATUSES = new Set(["received", "review", "interview"]);

export function ApplicationAdmissionRequirements({
  application,
}: {
  application: ApplicationWithFiles;
}) {
  const { selectMemberPlatformProfile, requestGuardianConsent } =
    useApplicationMutations();
  const [representativeName, setRepresentativeName] = useState(
    application.guardianConsent?.representativeName ?? "",
  );
  const [representativeEmail, setRepresentativeEmail] = useState(
    application.guardianConsent?.representativeEmail ?? "",
  );
  const dateOfBirth = application.dateOfBirth;
  const hasProfile = Boolean(application.memberPlatformUserId && dateOfBirth);
  const age = admissionAge(dateOfBirth);
  const isMinor = age !== null && age < 18;
  const isEligible = age !== null && age >= 16 && age < 25;
  const consent = application.guardianConsent;
  const isEditable = EDITABLE_STATUSES.has(application.status);
  const memberProfiles = useApplicationMemberPlatformProfiles(
    application._id,
    isEditable && !consent?.signedAt,
  );
  const pending =
    memberProfiles.isSearching ||
    selectMemberPlatformProfile.isPending ||
    requestGuardianConsent.isPending;
  if (application.status === "rejected") return null;

  async function selectProfile(profileId: string) {
    try {
      await selectMemberPlatformProfile.mutateAsync({
        applicationId: application._id,
        profileId,
      });
      toast.success("Member-Profil zugeordnet");
    } catch {
      toast.error("Member-Profil konnte nicht zugeordnet werden.");
    }
  }

  async function sendGuardianConsent() {
    try {
      await requestGuardianConsent.mutateAsync({
        applicationId: application._id,
        representativeName,
        representativeEmail,
      });
      toast.success("Zustimmungslink versendet");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Zustimmungslink konnte nicht versendet werden",
      );
    }
  }

  return (
    <section className="space-y-4 border-t pt-5">
      <h3 className="text-xl font-semibold">Member-Profil *</h3>
      <ApplicationAdmissionProfile
        canSync={isEditable}
        candidates={memberProfiles.candidates}
        dateOfBirth={dateOfBirth}
        hasProfile={hasProfile}
        isPending={pending}
        isSigned={Boolean(consent?.signedAt)}
        isSearching={memberProfiles.isSearching}
        searchError={memberProfiles.isError}
        selectedProfileId={application.memberPlatformUserId}
        selectingProfileId={
          selectMemberPlatformProfile.isPending
            ? selectMemberPlatformProfile.variables?.profileId
            : undefined
        }
        onSearch={() => void memberProfiles.refetch()}
        onSelect={selectProfile}
      />
      {hasProfile && isEligible && isMinor ? (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Für Minderjährige muss die gesetzliche Vertretung sicher zustimmen.
          </p>
          <div className="space-y-2">
            <Label htmlFor="guardian-name">
              Name der gesetzlichen Vertretung
            </Label>
            <Input
              id="guardian-name"
              value={representativeName}
              disabled={!isEditable || pending || Boolean(consent?.signedAt)}
              onChange={(event) => setRepresentativeName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian-email">
              Private E-Mail der Vertretung
            </Label>
            <Input
              id="guardian-email"
              type="email"
              value={representativeEmail}
              disabled={!isEditable || pending || Boolean(consent?.signedAt)}
              onChange={(event) => setRepresentativeEmail(event.target.value)}
            />
          </div>
          {consent?.signedAt ? (
            <p className="text-sm text-green-700">
              Zustimmung erteilt am {DATE_TIME_FORMAT.format(consent.signedAt)}
            </p>
          ) : consent?.lastSentAt ? (
            <p className="text-sm text-muted-foreground">
              Zuletzt versendet am {DATE_TIME_FORMAT.format(consent.lastSentAt)}
            </p>
          ) : null}
        </div>
      ) : null}
      {isEditable &&
      hasProfile &&
      isEligible &&
      isMinor &&
      !consent?.signedAt ? (
        <Button
          type="button"
          variant="outline"
          size="member"
          className="w-full"
          disabled={
            pending || !representativeName.trim() || !representativeEmail.trim()
          }
          onClick={sendGuardianConsent}
        >
          {consent?.lastSentAt
            ? "Zustimmungslink erneut senden"
            : "Zustimmungslink senden"}
        </Button>
      ) : null}
    </section>
  );
}

function admissionAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  try {
    return ageOnDate(dateOfBirth, Date.now());
  } catch {
    return null;
  }
}
