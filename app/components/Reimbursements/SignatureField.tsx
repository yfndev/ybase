"use client";

import { getFileUrlAction } from "@/lib/server/reimbursements/actions";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SignatureCanvas } from "./SignatureCanvas";

export { SignatureQRModal } from "./SignatureQRModal";

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
  if (storageId) {
    return <SignaturePreview storageId={storageId} />;
  }

  return (
    <SignatureCanvas
      onUploadComplete={onSignatureComplete}
      generateUploadUrl={customUploadUrl}
    />
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
