"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import SignaturePad from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { useSignatureResize } from "@/lib/hooks/useSignatureResize";
import { generateUploadUrl } from "@/lib/server/reimbursements/files";

type Props = {
  onUploadComplete: (key: string) => void;
  uploadSignature?: (blob: Blob) => Promise<string>;
};

export function SignatureCanvas({ onUploadComplete, uploadSignature }: Props) {
  const padRef = useRef<SignaturePad>(null);
  const [uploading, setUploading] = useState(false);
  useSignatureResize(padRef);

  const handleSave = async () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Bitte unterschreiben");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = pad.getTrimmedCanvas().toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();

      if (uploadSignature) {
        onUploadComplete(await uploadSignature(blob));
      } else {
        const { key, url } = await generateUploadUrl("image/png");
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });
        if (!response.ok) throw new Error();
        onUploadComplete(key);
      }

      toast.success("Unterschrift gespeichert");
    } catch {
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border bg-white">
        <SignaturePad
          ref={padRef}
          minWidth={2}
          maxWidth={3}
          canvasProps={{ className: "h-48 w-full sm:h-64" }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 px-3 sm:h-10 sm:flex-none"
          onClick={() => padRef.current?.clear()}
        >
          <RotateCcw className="size-4 mr-1" />
          Löschen
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 px-3 sm:h-10 sm:flex-none"
          onClick={handleSave}
          disabled={uploading}
        >
          {uploading && <Loader2 className="size-4 animate-spin mr-1" />}
          Unterschrift speichern
        </Button>
      </div>
    </div>
  );
}
