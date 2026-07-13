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
      <div className="flex flex-col items-stretch gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Unterschrift gespeichert
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 sm:h-10"
          onClick={() => onUploadComplete("")}
        >
          <RotateCcw className="size-4 mr-1" />
          Neu unterschreiben
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-lg bg-white">
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
