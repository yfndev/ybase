"use client";

import { Button } from "@/components/ui/button";
import { useSignatureResize } from "@/lib/hooks/useSignatureResize";
import { RotateCcw } from "lucide-react";
import { useRef } from "react";
import SignaturePad from "react-signature-canvas";

export function SignatureField({
  label,
  onChange,
}: {
  label: string;
  onChange: (dataUrl: string) => void;
}) {
  const padRef = useRef<SignaturePad>(null);
  useSignatureResize(padRef);

  function publish() {
    const pad = padRef.current;
    onChange(
      !pad || pad.isEmpty()
        ? ""
        : pad.getTrimmedCanvas().toDataURL("image/png"),
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-48 overflow-hidden rounded-md border bg-white">
        <SignaturePad
          ref={padRef}
          minWidth={2}
          maxWidth={3}
          onEnd={publish}
          canvasProps={{ className: "h-48 w-full", "aria-label": label }}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          padRef.current?.clear();
          onChange("");
        }}
      >
        <RotateCcw aria-hidden="true" />
        Löschen
      </Button>
    </div>
  );
}
