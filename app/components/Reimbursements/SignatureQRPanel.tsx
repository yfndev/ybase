"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { signStatus } from "@/(public)/_lib/signatures";
import { Button } from "@/components/ui/button";
import { createToken } from "@/lib/server/signatures/actions";
import type { SignatureUploadContext } from "@/lib/signatures/context";

const POLL_INTERVAL_MS = 2000;

export function SignatureQRPanel({
  onSignatureComplete,
  signatureContext,
  showStatusToast = true,
}: {
  onSignatureComplete: (key: string) => void | Promise<void>;
  signatureContext: SignatureUploadContext;
  showStatusToast?: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [tokenFailed, setTokenFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const onComplete = useRef(onSignatureComplete);
  onComplete.current = onSignatureComplete;

  useEffect(() => {
    let active = true;
    createToken(signatureContext)
      .then((value) => {
        if (active) setToken(value);
      })
      .catch(() => {
        if (active) setTokenFailed(true);
      });
    return () => {
      active = false;
    };
  }, [signatureContext]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      const data = await signStatus(token).catch(() => null);
      if (!data?.signatureStorageId) return;
      clearInterval(interval);
      try {
        await onComplete.current(data.signatureStorageId);
        if (showStatusToast) toast.success("Unterschrift empfangen");
      } catch {
        return;
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [showStatusToast, token]);

  if (tokenFailed) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border px-4 sm:h-48">
        <p className="text-sm text-muted-foreground">
          Link konnte nicht erstellt werden. Bitte versuche es später erneut.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border sm:h-48">
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  const signatureUrl = `${window.location.origin}/sign/${token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(signatureUrl);
    setCopied(true);
    toast.success("Link kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border p-4 sm:p-6">
      <p className="text-sm text-muted-foreground text-center">
        Scanne den QR-Code mit deinem Handy und unterschreibe dort.
      </p>
      <div className="bg-white p-3 rounded-lg border">
        <QRCodeSVG
          value={signatureUrl}
          size={180}
          className="size-36 sm:size-44"
        />
      </div>
      <div className="flex w-full max-w-sm gap-2">
        <input
          aria-label="Signatur-Link"
          readOnly
          value={signatureUrl}
          className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted truncate"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          aria-label="Link kopieren"
          title="Link kopieren"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Warte auf Unterschrift...
      </div>
    </div>
  );
}
