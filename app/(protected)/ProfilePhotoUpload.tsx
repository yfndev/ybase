"use client";

import { Check, Upload } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface Props {
  previewUrl?: string;
  hasFile: boolean;
  onFileChange: (file: File) => void;
}

export function ProfilePhotoUpload({
  previewUrl,
  hasFile,
  onFileChange,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
        onClick={() => fileInput.current?.click()}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
            <Upload
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Profilbild hochladen</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            JPEG oder PNG, maximal 5 MB
          </span>
        </span>
        {hasFile ? (
          <Check aria-hidden="true" className="size-5 text-primary" />
        ) : null}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileChange(selected);
        }}
      />
    </>
  );
}
