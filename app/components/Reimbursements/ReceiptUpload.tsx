"use client";

import {
  convertToJPG,
  FileConversionError,
  isValidFileType,
} from "@/lib/fileHandlers/fileConversion";
import {
  generateUploadUrl,
  getFileUrlAction,
} from "@/lib/server/reimbursements/actions";
import { FileText, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

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
      return;
    }
    let active = true;
    getFileUrlAction(storageId).then((url) => {
      if (active) setPreviewUrl(url);
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
    setIsPdf(fileIsPdf);
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
      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      className="hidden"
    />
  );

  if (previewUrl || isPdf) {
    return (
      <div
        className="border rounded-lg p-4 relative group cursor-pointer"
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
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <div className="text-white text-center">
            <Upload className="size-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Klicken zum Ändern</p>
          </div>
        </div>
        {fileInput}
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]);
      }}
      className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer"
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="font-medium">Beleg wird verarbeitet...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="size-8 text-primary" />
          </div>
          <p className="font-medium">
            Klicke hier oder ziehe deine Datei herein
          </p>
          <p className="text-sm text-muted-foreground">
            JPG, PNG, HEIC oder PDF (max. 10 MB)
          </p>
        </div>
      )}
      {fileInput}
    </div>
  );
}
