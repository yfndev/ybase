"use client";

import { DocumentContent } from "@/components/Documents/DocumentContent";
import { completeOwnDocument } from "@/lib/server/memberships/documentExecution";
import type { MembershipOnboardingDocument } from "@/lib/server/memberships/onboardingData";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { DocumentAction } from "./DocumentAction";

export function DocumentStep({
  document,
  onComplete,
}: {
  document: MembershipOnboardingDocument;
  onComplete: () => Promise<void>;
}) {
  const [working, setWorking] = useState(false);
  const [, startTransition] = useTransition();

  function complete(
    signatureStorageKey?: string,
    consentGranted?: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setWorking(true);
      startTransition(async () => {
        try {
          await completeOwnDocument({
            executionId: document.executionId,
            signatureStorageKey,
            consentGranted,
          });
          await onComplete();
          toast.success("Unterlage abgeschlossen.");
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
    <section aria-label={document.title}>
      <DocumentContent html={document.content} />
      <div className="mt-10 border-t-2 border-input pt-6">
        <DocumentAction
          type={document.type}
          working={working}
          onComplete={complete}
        />
      </div>
    </section>
  );
}
