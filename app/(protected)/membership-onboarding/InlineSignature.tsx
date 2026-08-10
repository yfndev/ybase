"use client";

import { OnboardingSignatureField } from "./OnboardingSignatureField";

export function InlineSignature({
  onSubmit,
}: {
  onSubmit: (storageKey: string) => Promise<void>;
}) {
  return (
    <OnboardingSignatureField
      onChange={onSubmit}
      submitLabel="Dokument unterzeichnen"
      showStatusToast={false}
    />
  );
}
