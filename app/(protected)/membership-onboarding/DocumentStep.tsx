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
    signatureDataUrl?: string,
    consentGranted?: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setWorking(true);
      startTransition(async () => {
        try {
          await completeOwnDocument({
            executionId: document.executionId,
            signatureDataUrl,
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
    <section
      className="flex min-h-0 flex-1 flex-col"
      aria-label={document.title}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DocumentContent html={document.content} />
        <div className="mt-10 border-t-2 border-input pt-6">
          <DocumentAction
            type={document.type}
            working={working}
            onComplete={complete}
          />
        </div>
      </div>
    </section>
  );
}
