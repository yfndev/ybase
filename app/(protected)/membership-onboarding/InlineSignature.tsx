"use client";

import { Button } from "@/components/ui/button";
import { useSignatureResize } from "@/lib/hooks/useSignatureResize";
import { Loader2, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import SignaturePad from "react-signature-canvas";

export function InlineSignature({
  onSubmit,
}: {
  onSubmit: (dataUrl: string) => Promise<void>;
}) {
  const padRef = useRef<SignaturePad>(null);
  const [submitting, setSubmitting] = useState(false);
  useSignatureResize(padRef);

  async function submit() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Bitte unterschreiben.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(pad.getTrimmedCanvas().toDataURL("image/png"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-48 overflow-hidden rounded-md border bg-white">
        <SignaturePad
          ref={padRef}
          minWidth={2}
          maxWidth={3}
          canvasProps={{
            className: "h-48 w-full",
            "aria-label": "Unterschriftsfeld",
          }}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => padRef.current?.clear()}
        >
          <RotateCcw aria-hidden="true" />
          Löschen
        </Button>
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting && (
            <Loader2 aria-hidden="true" className="animate-spin" />
          )}
          Dokument unterzeichnen
        </Button>
      </div>
    </div>
  );
}
