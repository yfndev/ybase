"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { MembershipDocumentVersionSummary } from "@/lib/server/memberships/documentPublication";
import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DocumentsTable } from "./DocumentsTable";
import { PublishDocumentForm } from "./PublishDocumentForm";

export function DocumentsClient({
  versions,
}: {
  versions: MembershipDocumentVersionSummary[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const activeVersions = versions.filter((version) => version.isActive);
  const archivedVersions = versions.filter((version) => !version.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Unterlagen" />
        {!showForm && (
          <Button
            type="button"
            variant="ghost"
            className="px-2 sm:px-3"
            onClick={() => setShowForm(true)}
          >
            <FilePlus2
              aria-hidden="true"
              className="size-5 stroke-[2.5] text-secondary"
            />
            Unterlage hinzufügen
          </Button>
        )}
      </div>

      {showForm ? (
        <PublishDocumentForm
          onCancel={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            router.refresh();
          }}
        />
      ) : (
        <>
          <DocumentsTable versions={activeVersions} />
          {archivedVersions.length > 0 && (
            <section className="space-y-3 border-t pt-6">
              <h2 className="font-semibold">Frühere Fassungen</h2>
              <DocumentsTable versions={archivedVersions} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
