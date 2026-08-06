"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  deactivateMembershipDocument,
  listMembershipDocumentVersions,
  type MembershipDocumentVersionSummary,
} from "@/lib/server/memberships/documentPublication";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DocumentVersionsList } from "./DocumentVersionsList";
import { DocumentVersionsSkeleton } from "./DocumentVersionsSkeleton";
import { PublishDocumentForm } from "./PublishDocumentForm";

export function DocumentsClient() {
  const [versions, setVersions] =
    useState<MembershipDocumentVersionSummary[]>();
  const [showForm, setShowForm] = useState(false);

  const reload = useCallback(async () => {
    try {
      setVersions(await listMembershipDocumentVersions());
    } catch (error) {
      setVersions([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unterlagen konnten nicht geladen werden.",
      );
    }
  }, []);

  useEffect(() => void reload(), [reload]);

  async function deactivate(versionId: string) {
    try {
      await deactivateMembershipDocument({ versionId });
      await reload();
      toast.success("Version deaktiviert.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Deaktivieren fehlgeschlagen",
      );
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Unterlagen"
        subtitle="Pflichtunterlagen für das Mitglieds-Onboarding"
      />
      {showForm ? (
        <PublishDocumentForm
          onCancel={() => setShowForm(false)}
          onPublished={async () => {
            setShowForm(false);
            await reload();
          }}
        />
      ) : (
        <Button type="button" onClick={() => setShowForm(true)}>
          <Plus aria-hidden="true" />
          Version veröffentlichen
        </Button>
      )}

      {versions ? (
        <DocumentVersionsList versions={versions} onDeactivate={deactivate} />
      ) : (
        <DocumentVersionsSkeleton />
      )}
    </div>
  );
}
