"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  deactivateMembershipDocument,
  getMembershipDocumentForEditing,
  listMembershipDocumentVersions,
  type MembershipDocumentVersionSummary,
} from "@/lib/server/memberships/documentPublication";
import { FilePlus2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DocumentVersionsList } from "./DocumentVersionsList";
import { DocumentVersionsSkeleton } from "./DocumentVersionsSkeleton";
import type { EditableMembershipDocument } from "./documentForm";
import { PublishDocumentForm } from "./PublishDocumentForm";

export function DocumentsClient() {
  const [versions, setVersions] =
    useState<MembershipDocumentVersionSummary[]>();
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<EditableMembershipDocument>();
  const [loadingVersionId, setLoadingVersionId] = useState<string>();

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
      toast.success("Version archiviert.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Archivieren fehlgeschlagen",
      );
    }
  }

  async function edit(versionId: string) {
    setLoadingVersionId(versionId);
    try {
      const document = await getMembershipDocumentForEditing({ versionId });
      if (document.kind === "optional_consent") {
        throw new Error(
          "Freiwillige Einwilligungen können nicht bearbeitet werden.",
        );
      }
      setEditingDocument({ ...document, kind: document.kind });
      setShowForm(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unterlage konnte nicht geöffnet werden.",
      );
    } finally {
      setLoadingVersionId(undefined);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingDocument(undefined);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Unterlagen"
        subtitle="Pflichtunterlagen für das Mitglieds-Onboarding"
      />
      {showForm ? (
        <PublishDocumentForm
          key={editingDocument?.id ?? "new"}
          document={editingDocument}
          onCancel={closeForm}
          onSaved={async () => {
            closeForm();
            await reload();
          }}
        />
      ) : (
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-semibold">Dokumentenverwaltung</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Inhalte bearbeiten, Zielgruppen festlegen und frühere Fassungen
              nachvollziehen.
            </p>
          </div>
          <Button
            variant="primary"
            type="button"
            onClick={() => {
              setEditingDocument(undefined);
              setShowForm(true);
            }}
          >
            <FilePlus2 aria-hidden="true" />
            Unterlage hinzufügen
          </Button>
        </div>
      )}

      {versions ? (
        <DocumentVersionsList
          versions={versions}
          loadingVersionId={loadingVersionId}
          onEdit={edit}
          onDeactivate={deactivate}
        />
      ) : (
        <DocumentVersionsSkeleton />
      )}
      {loadingVersionId && (
        <output className="sr-only">Unterlage wird geöffnet</output>
      )}
    </div>
  );
}
