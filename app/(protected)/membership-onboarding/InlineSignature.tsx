"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { SignatureField } from "./SignatureField";

export function InlineSignature({
  onSubmit,
}: {
  onSubmit: (dataUrl: string) => Promise<void>;
}) {
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!signature) {
      toast.error("Bitte unterschreiben.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(signature);
    } catch {
      // The caller already reports failures to the user.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <SignatureField label="Unterschriftsfeld" onChange={setSignature} />
      <Button type="button" onClick={() => void submit()} disabled={submitting}>
        {submitting && <Loader2 aria-hidden="true" className="animate-spin" />}
        Dokument unterzeichnen
      </Button>
    </div>
  );
}
