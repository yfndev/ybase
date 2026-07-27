"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { SelectMembers } from "@/components/Selectors/SelectMembers";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationWithFiles, User } from "@/lib/db/types";

export function ApplicationManagement({
  application,
  owners,
}: {
  application: ApplicationWithFiles;
  owners: User[];
}) {
  const { updateManagement } = useApplicationMutations();
  const [ownerIds, setOwnerIds] = useState(application.ownerIds);

  async function updateOwners(nextOwnerIds: string[]) {
    const previousOwnerIds = ownerIds;
    setOwnerIds(nextOwnerIds);
    try {
      await updateManagement.mutateAsync({
        applicationId: application._id,
        ownerIds: nextOwnerIds,
      });
      toast.success("Interne Zuständigkeit aktualisiert");
    } catch (error) {
      setOwnerIds(previousOwnerIds);
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  }

  return (
    <section className="space-y-3 border-t pt-5">
      <h3 className="text-xl font-semibold">Interne Zuständigkeit</h3>
      <SelectMembers
        id="application-owners"
        members={owners}
        value={ownerIds}
        onValueChange={updateOwners}
        placeholder="Zuständige Personen auswählen"
        searchPlaceholder="Name oder E-Mail suchen"
        disabled={updateManagement.isPending}
      />
    </section>
  );
}
