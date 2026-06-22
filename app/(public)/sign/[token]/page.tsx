"use client";

import { Button } from "@/components/ui/button";
import {
  submitSign,
  uploadViaPresign,
  validateSignToken,
  type SignValidation,
} from "@/(public)/_lib/publicApi";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Signature,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const [tokenData, setTokenData] = useState<SignValidation | null>(null);
  const signaturePadRef = useRef<SignaturePad>(null);
  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    validateSignToken(token).then(setTokenData);
  }, [token]);

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
      const blob = await (await fetch(dataUrl)).blob();

      const key = await uploadViaPresign(
        `/api/public/sign/${token}/upload-url`,
        { contentType: "image/png" },
        blob,
      );
      await submitSign(token, key);
      exitLandscapeFullscreen();
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
