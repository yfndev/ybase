"use client";

import { Button } from "@/components/ui/button";
import type { DocumentExecutionType } from "@/lib/db/types";
import { Loader2 } from "lucide-react";
import { InlineSignature } from "./InlineSignature";

export function DocumentAction({
  type,
  working,
  onComplete,
}: {
  type: DocumentExecutionType;
  working: boolean;
  onComplete: (
    signatureStorageKey?: string,
    consentGranted?: boolean,
  ) => Promise<void>;
}) {
  if (type === "signature") {
    return <InlineSignature onSubmit={(signature) => onComplete(signature)} />;
  }

  if (type === "optional_consent") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={working}
          onClick={() => void onComplete(undefined, true)}
        >
          {working && <Loader2 aria-hidden="true" className="animate-spin" />}
          Einwilligen
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={working}
          onClick={() => void onComplete(undefined, false)}
        >
          Nicht einwilligen
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" disabled={working} onClick={() => void onComplete()}>
      {working && <Loader2 aria-hidden="true" className="animate-spin" />}
      Kenntnisnahme bestätigen
    </Button>
  );
}
