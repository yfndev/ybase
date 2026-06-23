"use client";

import { Button } from "@/components/ui/button";
import { getFileUrlAction } from "@/lib/server/reimbursements/actions";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
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
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "mobile" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("mobile")}
        >
          <Smartphone className="size-4 mr-1" />
          Auf dem Handy
        </Button>
        <Button
          type="button"
          variant={mode === "desktop" ? "default" : "outline"}
          size="sm"
          className="flex-1"
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
    getFileUrlAction(storageId).then((url) => {
      if (active) setPreviewUrl(url);
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
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center mt-2">
        Unterschrift gespeichert
      </p>
    </div>
  );
}
