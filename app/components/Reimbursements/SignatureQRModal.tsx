"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import toast from "react-hot-toast";

export function SignatureQRModal({
  token,
  open,
  onClose,
}: {
  token: string;
  open: boolean;
  onClose: () => void;
  onSignatureReceived?: (key: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const signatureUrl = `${origin}/sign/${token}`;

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
