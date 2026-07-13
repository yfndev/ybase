"use client";

import { CirclePlus, Loader2 } from "lucide-react";
import { type RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onFile: (file: File) => void;
};

export function ReceiptDropzone({ inputRef, isUploading, onFile }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section
      aria-label="Beleg hochladen"
      aria-busy={isUploading}
      onDragEnter={(event) => {
        event.preventDefault();
        if (isUploading) return;
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsDragging(false);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (isUploading) return;
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-ring",
        isDragging && "border-ring bg-muted/60",
      )}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="font-medium">Beleg wird verarbeitet...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2">
            <CirclePlus className="mb-2 size-12 text-muted-foreground" />
            <strong className="text-base">
              Datei hochladen oder hier ablegen
            </strong>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, HEIC oder PDF, bis 10 MB
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="mt-1 rounded-[8px]"
            onClick={() => inputRef.current?.click()}
          >
            Datei auswählen
          </Button>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.heic,.pdf"
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
        className="hidden"
      />
    </section>
  );
}
