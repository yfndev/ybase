"use client";

import { CheckCircle2, PenLine, RotateCcw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFileUrlAction } from "@/lib/server/reimbursements/files";
import { SignatureCanvas } from "./SignatureCanvas";
import { SignatureQRPanel } from "./SignatureQRPanel";

interface Props {
  onSignatureComplete: (key: string) => void;
  storageId?: string;
  uploadSignature?: (blob: Blob) => Promise<string>;
  getFileUrl?: (storageId: string) => Promise<string | null>;
  onClear?: () => void;
  allowMobileHandoff?: boolean;
}

export function SignatureField({
  onSignatureComplete,
  storageId,
  uploadSignature,
  getFileUrl = getFileUrlAction,
  onClear,
  allowMobileHandoff = true,
}: Props) {
  const [mode, setMode] = useState<"direct" | "mobile">("direct");

  if (storageId) {
    return (
      <SignaturePreview
        storageId={storageId}
        getFileUrl={getFileUrl}
        onClear={onClear}
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      {allowMobileHandoff ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={mode === "direct" ? "default" : "outline"}
            className="h-12 min-w-0 w-full px-3"
            onClick={() => setMode("direct")}
          >
            <PenLine className="size-4 mr-1" />
            Auf diesem Gerät
          </Button>
          <Button
            type="button"
            variant={mode === "mobile" ? "default" : "outline"}
            className="h-12 min-w-0 w-full px-3"
            onClick={() => setMode("mobile")}
          >
            <Smartphone className="size-4 mr-1" />
            Mit dem Handy
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 border-l-4 border-primary bg-primary/10 px-4 py-3">
          <Smartphone className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            Unterschreibe direkt mit Finger, Stift oder Maus auf diesem Gerät.
          </p>
        </div>
      )}

      {mode === "direct" ? (
        <SignatureCanvas
          onUploadComplete={onSignatureComplete}
          uploadSignature={uploadSignature}
        />
      ) : (
        <SignatureQRPanel onSignatureComplete={onSignatureComplete} />
      )}
    </div>
  );
}

function SignaturePreview({
  storageId,
  getFileUrl,
  onClear,
}: {
  storageId: string;
  getFileUrl: (storageId: string) => Promise<string | null>;
  onClear?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPreviewUrl(null);
    getFileUrl(storageId)
      .then((url) => {
        if (active) setPreviewUrl(url);
      })
      .catch(() => {
        if (active) setPreviewUrl(null);
      });
    return () => {
      active = false;
    };
  }, [getFileUrl, storageId]);

  return (
    <div className="border rounded-lg p-4">
      {previewUrl ? (
        // biome-ignore lint/performance/noImgElement: Signature previews use local signed URLs.
        <img src={previewUrl} alt="Unterschrift" className="max-h-24 mx-auto" />
      ) : (
        <div className="h-24 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-green-600" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center mt-2">
        Unterschrift gespeichert
      </p>
      {onClear ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={onClear}
        >
          <RotateCcw className="size-4" />
          Neu unterschreiben
        </Button>
      ) : null}
    </div>
  );
}
