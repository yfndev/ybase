"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Signature,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
import toast from "react-hot-toast";

async function enterLandscapeFullscreen() {
  try {
    await document.documentElement.requestFullscreen?.();
  } catch {}
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    await orientation?.lock?.("landscape");
  } catch {}
}

function exitLandscapeFullscreen() {
  try {
    screen.orientation?.unlock?.();
  } catch {}
  try {
    if (document.fullscreenElement) document.exitFullscreen?.();
  } catch {}
}

export default function SignaturePage() {
  const { token } = useParams<{ token: string }>();

  const tokenData = useQuery(api.signatures.queries.validate, { token });
  const generateUploadUrl = useMutation(
    api.signatures.functions.generateUploadUrl,
  );
  const submitSignature = useMutation(api.signatures.functions.submit);

  const signaturePadRef = useRef<SignaturePad>(null);
  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleStart = async () => {
    await enterLandscapeFullscreen();
    setStarted(true);
  };

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
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const uploadUrl = await generateUploadUrl({ token });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });

      if (!result.ok) throw new Error();

      const { storageId } = await result.json();
      await submitSignature({ token, signatureStorageId: storageId });
      exitLandscapeFullscreen();
      setSubmitted(true);
    } catch {
      toast.error("Speichern fehlgeschlagen");
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

  if (!started) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-xs text-center">
          <Signature className="size-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-6">Unterschreiben</h1>
          <Button size="lg" className="w-full h-14" onClick={handleStart}>
            Unterschrift starten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="signature-page fixed inset-0 flex flex-col bg-white">
      <div className="flex-1 p-4 flex flex-col">
        <p className="text-center text-muted-foreground mb-2">
          Bitte hier unterschreiben
        </p>
        <div className="flex-1 border-2 border-dashed rounded-lg bg-gray-50 relative">
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              className: "absolute inset-0 w-full h-full",
            }}
          />
          <div className="absolute left-4 right-4 bottom-1/3 border-b border-gray-300 pointer-events-none" />
        </div>
      </div>
      <div className="p-4 flex gap-4 border-t">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 h-14"
          onClick={() => signaturePadRef.current?.clear()}
        >
          <RotateCcw className="size-5 mr-2" />
          Löschen
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
          Speichern
        </Button>
      </div>

      <style jsx global>{`
        @media screen and (orientation: portrait) {
          .signature-page {
            transform: rotate(90deg);
            transform-origin: left top;
            width: 100vh;
            height: 100vw;
            position: fixed;
            top: 100%;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}
