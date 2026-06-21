"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Loader2, RotateCcw, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SignaturePad from "react-signature-canvas";

interface Props {
  onSignatureComplete: (storageId: Id<"_storage">) => void;
  storageId?: Id<"_storage">;
  generateUploadUrl?: () => Promise<string>;
}

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function SignatureField({
  onSignatureComplete,
  storageId,
  generateUploadUrl: customUploadUrl,
}: Props) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  if (storageId) {
    return <SignaturePreview storageId={storageId} />;
  }

  if (isTouch) {
    return (
      <MobileCanvas
        onSignatureComplete={onSignatureComplete}
        generateUploadUrl={customUploadUrl}
      />
    );
  }

  return <DesktopQRFlow onSignatureComplete={onSignatureComplete} />;
}

function SignaturePreview({ storageId }: { storageId: Id<"_storage"> }) {
  const previewUrl = useQuery(api.reimbursements.queries.getFileUrl, {
    storageId,
  });

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

function MobileCanvas({
  onSignatureComplete,
  generateUploadUrl: customUploadUrl,
}: {
  onSignatureComplete: (storageId: Id<"_storage">) => void;
  generateUploadUrl?: () => Promise<string>;
}) {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [uploading, setUploading] = useState(false);

  const defaultUploadUrl = useMutation(
    api.reimbursements.functions.generateUploadUrl,
  );
  const getUploadUrl = customUploadUrl || defaultUploadUrl;

  const handleSave = async () => {
    const signaturePad = signaturePadRef.current;
    if (!signaturePad || signaturePad.isEmpty()) {
      toast.error("Bitte unterschreiben");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = signaturePad.getTrimmedCanvas().toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const uploadUrl = await getUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });

      if (!response.ok) throw new Error();

      const { storageId } = await response.json();
      onSignatureComplete(storageId);
      toast.success("Unterschrift gespeichert");
    } catch {
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Bitte hier unterschreiben.
      </p>
      <div className="border rounded-lg bg-white">
        <SignaturePad
          ref={signaturePadRef}
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
          onClick={() => signaturePadRef.current?.clear()}
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

function DesktopQRFlow({
  onSignatureComplete,
}: {
  onSignatureComplete: (storageId: Id<"_storage">) => void;
}) {
  const createToken = useMutation(api.signatures.functions.createToken);
  const [token, setToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = async () => {
    const newToken = await createToken();
    setToken(newToken);
    setModalOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full h-14"
        onClick={handleOpen}
      >
        <Smartphone className="size-5 mr-2" />
        Auf Handy unterschreiben
      </Button>

      {token && (
        <SignatureQRModal
          token={token}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSignatureReceived={(storageId) => {
            onSignatureComplete(storageId);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}

export function SignatureQRModal({
  token,
  open,
  onClose,
  onSignatureReceived,
}: {
  token: string;
  open: boolean;
  onClose: () => void;
  onSignatureReceived: (storageId: Id<"_storage">) => void;
}) {
  const [copied, setCopied] = useState(false);
  const signatureUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/sign/${token}`;

  const tokenData = useQuery(
    api.signatures.queries.getStatus,
    open ? { token } : "skip",
  );

  useEffect(() => {
    if (tokenData?.signatureStorageId) {
      onSignatureReceived(tokenData.signatureStorageId);
      toast.success("Unterschrift empfangen");
      onClose();
    }
  }, [tokenData?.signatureStorageId, onSignatureReceived, onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(signatureUrl);
    setCopied(true);
    toast.success("Link kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Auf Handy unterschreiben</DialogTitle>
          <DialogDescription>
            Scanne den QR-Code oder kopiere den Link um auf deinem Handy zu
            unterschreiben.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={signatureUrl} size={200} />
          </div>

          <div className="flex w-full gap-2">
            <input
              readOnly
              value={signatureUrl}
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted truncate"
            />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Warte auf Unterschrift...
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
