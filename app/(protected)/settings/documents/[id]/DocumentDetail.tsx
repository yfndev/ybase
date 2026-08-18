"use client";

import { DocumentContent } from "@/components/Documents/DocumentContent";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP_DOCUMENT_LABELS } from "@/lib/members/documents";
import {
  deactivateMembershipDocument,
  type MembershipDocument,
} from "@/lib/server/memberships/documentPublication";
import { Archive, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { DOCUMENT_DATE_FORMAT } from "../documentForm";
import { PublishDocumentForm } from "../PublishDocumentForm";

const DOCUMENTS_URL = "/settings/documents";

export function DocumentDetail({
  document,
  departmentNames,
}: {
  document: MembershipDocument;
  departmentNames: string[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiving, startArchiving] = useTransition();
  const editable =
    document.isActive && document.kind !== "optional_consent"
      ? { ...document, kind: document.kind }
      : undefined;

  function backToList() {
    router.push(DOCUMENTS_URL);
    router.refresh();
  }

  function archive() {
    startArchiving(async () => {
      try {
        await deactivateMembershipDocument({ versionId: document.id });
        toast.success("Version archiviert.");
        backToList();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Archivieren fehlgeschlagen",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.title}
        showBackButton
        backUrl={DOCUMENTS_URL}
      />

      {isEditing && editable ? (
        <PublishDocumentForm
          document={editable}
          onCancel={() => setIsEditing(false)}
          onSaved={async () => backToList()}
        />
      ) : (
        <div className="max-w-4xl space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Details</h2>
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil aria-hidden="true" />
                    Bearbeiten
                  </Button>
                )}
                {document.isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isArchiving}
                    onClick={archive}
                  >
                    <Archive aria-hidden="true" />
                    Archivieren
                  </Button>
                )}
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Art"
                value={MEMBERSHIP_DOCUMENT_LABELS[document.kind]}
              />
              <Field label="Version" value={document.versionLabel} />
              <Field
                label="Veröffentlicht"
                value={DOCUMENT_DATE_FORMAT.format(document.publishedAt)}
              />
              <Field
                label="Status"
                value={document.isActive ? "Aktiv" : "Archiviert"}
              />
              <Field
                label="Ziel-Departments"
                value={
                  departmentNames.length > 0
                    ? departmentNames.join(", ")
                    : "Alle Departments"
                }
              />
            </dl>
          </section>

          <section className="space-y-4 border-t pt-6">
            <h2 className="text-xl font-semibold">Inhalt</h2>
            <DocumentContent html={document.content} />
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base">{value}</dd>
    </div>
  );
}
