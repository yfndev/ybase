"use client";

import type { DocumentExecutionType } from "@/lib/db/types";
import { completeOwnDocument } from "@/lib/server/memberships/documentExecution";
import type { MembershipOnboardingContext } from "@/lib/server/memberships/onboardingData";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { DocumentContent } from "@/components/Documents/DocumentContent";
import { DocumentAction } from "./DocumentAction";

type DocumentTask = MembershipOnboardingContext["documents"][number];

const DESCRIPTIONS: Record<DocumentExecutionType, string> = {
  signature: "Lies die Unterlage vollständig und unterschreibe sie unten.",
  acknowledgement:
    "Lies die Unterlage vollständig und bestätige unten deine Kenntnisnahme.",
  optional_consent:
    "Diese Einwilligung ist freiwillig. Mit beiden Antworten kommst du im Onboarding weiter.",
};

export function DocumentTasks({
  documents,
  onComplete,
}: {
  documents: DocumentTask[];
  onComplete: () => Promise<void>;
}) {
  const [working, setWorking] = useState(false);
  const [, startTransition] = useTransition();
  const open = documents.filter(({ status }) => status === "assigned");
  const current = open[0];
  if (!current) return null;
  const step = documents.length - open.length + 1;

  function complete(
    signatureDataUrl?: string,
    consentGranted?: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setWorking(true);
      startTransition(async () => {
        try {
          await completeOwnDocument({
            executionId: current.executionId,
            signatureDataUrl,
            consentGranted,
          });
          await onComplete();
          toast.success("Dokument abgeschlossen.");
          resolve();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Speichern fehlgeschlagen",
          );
          reject(error);
        } finally {
          setWorking(false);
        }
      });
    });
  }

  return (
    <section aria-labelledby="document-heading">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        Schritt {step} von {documents.length + 1}
      </p>
      <h1 id="document-heading" className="mt-2 text-2xl font-semibold">
        {current.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {DESCRIPTIONS[current.type]} Version {current.versionLabel}.
      </p>
      <DocumentContent html={current.content} />
      <div className="mt-6">
        <DocumentAction
          type={current.type}
          working={working}
          onComplete={complete}
        />
      </div>
    </section>
  );
}
