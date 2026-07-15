"use client";

import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SignaturePad from "react-signature-canvas";
import { uploadViaPresign } from "@/(public)/_lib/http";
import {
  type SignValidation,
  submitSign,
  validateSignToken,
} from "@/(public)/_lib/signatures";
import { Button } from "@/components/ui/button";

export default function SignaturePage() {
  const { token } = useParams<{ token: string }>();

  const [tokenData, setTokenData] = useState<SignValidation | null>(null);
  const signaturePadRef = useRef<SignaturePad>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    validateSignToken(token).then(setTokenData);
  }, [token]);

  const handleSave = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toast.error("Bitte unterschreiben");
      return;
    }
    setIsSubmitting(true);
    try {
      const dataUrl = signaturePadRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();

      await uploadViaPresign(
        `/api/public/sign/${token}/upload-url`,
        { contentType: "image/png" },
        blob,
      );
      await submitSign(token);
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white p-8">
        <div className="text-center max-w-md">
          <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unterschrift gespeichert</h1>
          <p className="text-muted-foreground">
            Du kannst dieses Fenster jetzt schließen.
          </p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tokenData.valid) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="size-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link ungültig</h1>
          <p className="text-muted-foreground">{tokenData.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col p-4 sm:p-6">
        <p className="text-center text-muted-foreground mb-2">
          Bitte hier unterschreiben
        </p>
        <div className="flex-1 border-2 border-dashed rounded-lg bg-gray-50 relative">
          <SignaturePad
            ref={signaturePadRef}
            minWidth={2}
            maxWidth={3}
            canvasProps={{
              className: "absolute inset-0 w-full h-full",
            }}
          />
          <div className="absolute left-4 right-4 bottom-1/4 border-b border-gray-300 pointer-events-none" />
        </div>
      </div>
      <div className="border-t p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-3xl gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            className="h-12 flex-1 sm:h-14"
            onClick={() => signaturePadRef.current?.clear()}
          >
            <RotateCcw className="size-5 mr-2" />
            Löschen
          </Button>
          <Button
            size="lg"
            className="h-12 flex-1 sm:h-14"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Speichern"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
