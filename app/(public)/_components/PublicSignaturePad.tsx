"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import SignaturePad from "react-signature-canvas";
import { useSignatureResize } from "@/lib/hooks/useSignatureResize";

type Props = {
  onUploadComplete: (key: string) => void;
  storageId?: string;
  uploadSignature: (blob: Blob) => Promise<string>;
};

export function PublicSignaturePad({
  onUploadComplete,
  storageId,
  uploadSignature,
}: Props) {
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
      const key = await uploadSignature(blob);
      onUploadComplete(key);
      toast.success("Unterschrift gespeichert");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen",
      );
    } finally {
      setUploading(false);
    }
  };

  if (storageId) {
    return (
      <div className="border rounded-lg p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Unterschrift gespeichert
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onUploadComplete("")}
        >
          <RotateCcw className="size-4 mr-1" />
          Neu unterschreiben
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-lg bg-white">
        <SignaturePad
          ref={padRef}
          minWidth={2}
          maxWidth={3}
          canvasProps={{ className: "w-full h-32" }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => padRef.current?.clear()}
        >
          <RotateCcw className="size-4 mr-1" />
          Löschen
        </Button>
        <Button
          type="button"
          size="sm"
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
