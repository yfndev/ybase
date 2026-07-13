"use client";

import { CheckCircle2, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFileUrlAction } from "@/lib/server/reimbursements/actions";
import { SignatureCanvas } from "./SignatureCanvas";
import { SignatureQRPanel } from "./SignatureQRPanel";

interface Props {
  onSignatureComplete: (key: string) => void;
  storageId?: string;
  generateUploadUrl?: () => Promise<string>;
}

export function SignatureField({
  onSignatureComplete,
  storageId,
  generateUploadUrl: customUploadUrl,
}: Props) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");

  if (storageId) {
    return <SignaturePreview storageId={storageId} />;
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === "mobile" ? "default" : "outline"}
          className="h-12 min-w-0 w-full px-3"
          onClick={() => setMode("mobile")}
        >
          <Smartphone className="size-4 mr-1" />
          Auf dem Handy
        </Button>
        <Button
          type="button"
          variant={mode === "desktop" ? "default" : "outline"}
          className="h-12 min-w-0 w-full px-3"
          onClick={() => setMode("desktop")}
        >
          <Monitor className="size-4 mr-1" />
          Am Computer
        </Button>
      </div>

      {mode === "mobile" ? (
        <SignatureQRPanel onSignatureComplete={onSignatureComplete} />
      ) : (
        <SignatureCanvas
          onUploadComplete={onSignatureComplete}
          generateUploadUrl={customUploadUrl}
        />
      )}
    </div>
  );
}

function SignaturePreview({ storageId }: { storageId: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPreviewUrl(null);
    getFileUrlAction(storageId)
      .then((url) => {
        if (active) setPreviewUrl(url);
      })
      .catch(() => {
        if (active) setPreviewUrl(null);
      });
    return () => {
      active = false;
    };
  }, [storageId]);

  return (
    <div className="border rounded-lg p-4">
      {previewUrl ? (
        <img src={previewUrl} alt="Unterschrift" className="max-h-24 mx-auto" />
      ) : (
        <div className="h-24 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-green-600" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center mt-2">
        Unterschrift gespeichert
      </p>
    </div>
  );
}
