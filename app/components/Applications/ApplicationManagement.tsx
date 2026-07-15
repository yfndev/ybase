"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { UNASSIGNED_APPLICATIONS } from "./applicationTable";

function toLocalDateTime(timestamp?: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(timestamp - offset).toISOString().slice(0, 16);
}

export function ApplicationManagement({
  application,
  owners,
}: {
  application: ApplicationWithFiles;
  owners: User[];
}) {
  const { updateManagement } = useApplicationMutations();
  const [ownerId, setOwnerId] = useState(
    application.ownerId ?? UNASSIGNED_APPLICATIONS,
  );
  const [internalNotes, setInternalNotes] = useState(
    application.internalNotes ?? "",
  );
  const [interviewAt, setInterviewAt] = useState(
    toLocalDateTime(application.interviewAt),
  );

  async function saveManagement() {
    const parsedInterview = interviewAt
      ? new Date(interviewAt).getTime()
      : null;
    if (parsedInterview !== null && Number.isNaN(parsedInterview)) {
      toast.error("Bitte gib einen gültigen Interviewtermin an");
      return;
    }
    try {
      await updateManagement.mutateAsync({
        applicationId: application._id,
        ownerId: ownerId === UNASSIGNED_APPLICATIONS ? null : ownerId,
        internalNotes,
        interviewAt: parsedInterview,
      });
      toast.success("Bewerbung aktualisiert");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Interne Bearbeitung</h3>
      <div className="grid gap-1.5">
        <Label htmlFor="application-owner">Verantwortlich</Label>
        <Select value={ownerId} onValueChange={setOwnerId}>
          <SelectTrigger id="application-owner" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_APPLICATIONS}>
              Nicht zugewiesen
            </SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner._id} value={owner._id}>
                {owner.name || owner.email || "Unbenannt"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="application-interview">Interviewtermin</Label>
        <Input
          id="application-interview"
          type="datetime-local"
          value={interviewAt}
          onChange={(e) => setInterviewAt(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="application-notes">Interne Notizen</Label>
        <Textarea
          id="application-notes"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Nur für P&C und Admins sichtbar"
          rows={5}
        />
      </div>
      <Button onClick={saveManagement} disabled={updateManagement.isPending}>
        {updateManagement.isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : null}
        Bearbeitung speichern
      </Button>
    </section>
  );
}
