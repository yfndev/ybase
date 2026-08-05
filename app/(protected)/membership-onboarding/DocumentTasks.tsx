"use client";

import { Button } from "@/components/ui/button";
import type { MembershipOnboardingContext } from "@/lib/server/memberships/onboardingData";
import { completeOwnDocument } from "@/lib/server/memberships/documentExecution";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { InlineSignature } from "./InlineSignature";

type DocumentTask = MembershipOnboardingContext["documents"][number];

export function DocumentTasks({
  documents,
  onComplete,
}: {
  documents: DocumentTask[];
  onComplete: () => Promise<void>;
}) {
  const [signingId, setSigningId] = useState<string>();
  const [pendingId, setPendingId] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function complete(
    document: DocumentTask,
    signatureDataUrl?: string,
    consentGranted?: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setPendingId(document.executionId);
      startTransition(async () => {
        try {
          await completeOwnDocument({
            executionId: document.executionId,
            signatureDataUrl,
            consentGranted,
          });
          setSigningId(undefined);
          await onComplete();
          toast.success("Dokument abgeschlossen.");
          resolve();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Speichern fehlgeschlagen",
          );
          reject(error);
        } finally {
          setPendingId(undefined);
        }
      });
    });
  }

  return (
    <section aria-labelledby="documents-heading">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        Schritt 2 von 2
      </p>
      <h1 id="documents-heading" className="mt-2 text-2xl font-semibold">
        Unterlagen prüfen und bestätigen
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Öffne jede Unterlage, lies sie vollständig und schließe die jeweilige
        Bestätigung ab. Danach wird dein YBase-Zugang automatisch
        freigeschaltet.
      </p>
      <div className="mt-7 space-y-4">
        {documents.map((document) => {
          const working = isPending && pendingId === document.executionId;
          return (
            <article
              key={document.executionId}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{document.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Version {document.versionLabel}
                  </p>
                </div>
                {document.status === "completed" && (
                  <CheckCircle2
                    aria-label="Abgeschlossen"
                    className="size-5 text-emerald-600"
                  />
                )}
              </div>
              <a
                href={document.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                PDF öffnen{" "}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
              {document.status === "assigned" && (
                <div className="mt-5">
                  {document.type === "signature" ? (
                    signingId === document.executionId ? (
                      <InlineSignature
                        onSubmit={(signature) => complete(document, signature)}
                      />
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setSigningId(document.executionId)}
                      >
                        Unterschreiben
                      </Button>
                    )
                  ) : document.type === "optional_consent" ? (
                    <div>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Diese Einwilligung ist freiwillig. Beide Auswahlen
                        schließen die Aufgabe ab.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={working}
                          onClick={() =>
                            void complete(document, undefined, true)
                          }
                        >
                          {working && (
                            <Loader2
                              aria-hidden="true"
                              className="animate-spin"
                            />
                          )}
                          Einwilligen
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={working}
                          onClick={() =>
                            void complete(document, undefined, false)
                          }
                        >
                          Nicht einwilligen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      disabled={working}
                      onClick={() => void complete(document)}
                    >
                      {working && (
                        <Loader2 aria-hidden="true" className="animate-spin" />
                      )}
                      Kenntnisnahme bestätigen
                    </Button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
