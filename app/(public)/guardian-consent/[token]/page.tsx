"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SignaturePad from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GUARDIAN_CONSENT_TEXT } from "@/lib/applications/guardianConsent";
import { useSignatureResize } from "@/lib/hooks/useSignatureResize";
import type { GuardianConsentValidation } from "@/lib/server/applications/guardianConsentPublic";
import { GuardianConsentStatusScreen } from "./_components/GuardianConsentStatusScreen";

export default function GuardianConsentPage() {
  const { token } = useParams<{ token: string }>();
  const padRef = useRef<SignaturePad>(null);
  const [validation, setValidation] =
    useState<GuardianConsentValidation | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  useSignatureResize(padRef);

  useEffect(() => {
    fetch(`/api/public/applications/guardian-consent/${token}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then(setValidation)
      .catch(() =>
        setValidation({ valid: false, error: "Verbindung fehlgeschlagen" }),
      );
  }, [token]);

  async function submitConsent() {
    const pad = padRef.current;
    if (!confirmed || !pad || pad.isEmpty()) {
      toast.error("Bitte bestätige den Text und unterschreibe.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/public/applications/guardian-consent/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signatureDataUrl: pad.getTrimmedCanvas().toDataURL("image/png"),
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Speichern fehlgeschlagen");
      setIsComplete(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!validation) return <GuardianConsentStatusScreen status="loading" />;
  if (!validation.valid) {
    return (
      <GuardianConsentStatusScreen status="invalid" error={validation.error} />
    );
  }
  if (isComplete) {
    return <GuardianConsentStatusScreen status="complete" />;
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Zustimmung zur Mitgliedschaft
        </h1>
        <p className="text-muted-foreground">
          Hallo {validation.representativeName}, bitte bestätige den
          Aufnahmeantrag von {validation.applicantName}.
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox
          id="guardian-consent-confirmation"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked === true)}
        />
        <Label
          htmlFor="guardian-consent-confirmation"
          className="leading-relaxed"
        >
          {GUARDIAN_CONSENT_TEXT}
        </Label>
      </div>
      <div className="space-y-3">
        <Label>Unterschrift</Label>
        <div className="overflow-hidden rounded-lg border bg-white">
          <SignaturePad
            ref={padRef}
            minWidth={2}
            maxWidth={3}
            canvasProps={{ className: "h-56 w-full" }}
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => padRef.current?.clear()}
          >
            <RotateCcw className="size-4" />
            Löschen
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={!confirmed || isSubmitting}
            onClick={submitConsent}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Zustimmung unterschreiben
          </Button>
        </div>
      </div>
    </main>
  );
}
