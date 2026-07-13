"use client";

import { FileText, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  convertToJPG,
  FileConversionError,
  isValidFileType,
} from "@/lib/fileHandlers/fileConversion";
import {
  generateUploadUrl,
  getFileInfoAction,
} from "@/lib/server/reimbursements/actions";
import { ReceiptDropzone } from "./ReceiptDropzone";

interface Props {
  onUploadComplete: (key: string) => void;
  storageId?: string;
}

export function ReceiptUpload({ onUploadComplete, storageId }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storageId) {
      setPreviewUrl(null);
      setIsPdf(false);
      return;
    }
    let active = true;
    getFileInfoAction(storageId)
      .then(({ url, contentType }) => {
        if (!active) return;
        setPreviewUrl(url);
        setIsPdf(contentType === "application/pdf");
      })
      .catch(() => {
        if (!active) return;
        setPreviewUrl(null);
        setIsPdf(false);
      });
    return () => {
      active = false;
    };
  }, [storageId]);

  const handleFile = async (file: File) => {
    if (!isValidFileType(file)) {
      return toast.error("Nur JPG, PNG, HEIC und PDF erlaubt");
    }

    const fileIsPdf = file.type === "application/pdf";
    setIsUploading(true);
    try {
      const convertedFile = await convertToJPG(file);
      const { key, url } = await generateUploadUrl(convertedFile.type);
      const result = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": convertedFile.type },
        body: convertedFile,
      });
      if (!result.ok) throw new Error();

      setIsPdf(fileIsPdf);
      onUploadComplete(key);
      toast.success("Beleg hochgeladen");
    } catch (error) {
      toast.error(
        error instanceof FileConversionError
          ? error.message
          : "Upload fehlgeschlagen",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".jpg,.jpeg,.png,.heic,.pdf"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        event.target.value = "";
      }}
      className="hidden"
    />
  );

  if (previewUrl || isPdf) {
    return (
      <>
        <button
          type="button"
          className="group relative block w-full cursor-pointer border bg-transparent p-4 text-inherit"
          onClick={() => inputRef.current?.click()}
        >
          {isPdf ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <FileText className="size-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">PDF hochgeladen</p>
            </div>
          ) : (
            <img
              src={previewUrl ?? ""}
              alt="Beleg"
              className="max-h-48 mx-auto rounded"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="text-center text-white">
              <Upload className="mx-auto mb-2 size-8" />
              <p className="text-sm font-medium">Klicken zum Ändern</p>
            </div>
          </div>
        </button>
        {fileInput}
      </>
    );
  }

  return (
    <ReceiptDropzone
      inputRef={inputRef}
      isUploading={isUploading}
      onFile={handleFile}
    />
  );
}
