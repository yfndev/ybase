"use client";

import toast from "react-hot-toast";
import { useApplicationMemberPlatformProfiles } from "@/lib/client/applications/hooks/useApplicationMemberPlatformProfiles";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { ApplicationAdmissionProfile } from "./ApplicationAdmissionProfile";

const EDITABLE_STATUSES = new Set(["received", "review", "interview"]);

export function ApplicationAdmissionRequirements({
  application,
}: {
  application: ApplicationWithFiles;
}) {
  const { selectMemberPlatformProfile } = useApplicationMutations();
  const isEditable = EDITABLE_STATUSES.has(application.status);
  const memberProfiles = useApplicationMemberPlatformProfiles(
    application._id,
    isEditable,
  );
  const pending =
    memberProfiles.isSearching || selectMemberPlatformProfile.isPending;
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

  return (
    <section className="space-y-4 border-t pt-5">
      <h3 className="text-xl font-semibold">Member-Profil *</h3>
      <ApplicationAdmissionProfile
        canSync={isEditable}
        candidates={memberProfiles.candidates}
        dateOfBirth={application.dateOfBirth}
        hasProfile={Boolean(
          application.memberPlatformUserId && application.dateOfBirth,
        )}
        isPending={pending}
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
    </section>
  );
}
