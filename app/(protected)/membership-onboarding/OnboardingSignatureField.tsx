"use client";

import { SignatureField } from "@/components/Reimbursements/SignatureField";
import {
  createMembershipSignatureUpload,
  getMembershipSignatureUrl,
} from "@/lib/server/memberships/signatureUploads";

async function uploadSignature(blob: Blob): Promise<string> {
  const { key, url } = await createMembershipSignatureUpload(blob.type);
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": blob.type },
    body: blob,
  });
  if (!response.ok) throw new Error("Upload failed");
  return key;
}

export function OnboardingSignatureField({
  storageKey,
  onChange,
  submitLabel,
  showStatusToast,
}: {
  storageKey?: string;
  onChange: (storageKey: string) => void | Promise<void>;
  submitLabel?: string;
  showStatusToast?: boolean;
}) {
  return (
    <SignatureField
      onSignatureComplete={onChange}
      storageId={storageKey}
      uploadSignature={uploadSignature}
      getFileUrl={getMembershipSignatureUrl}
      onClear={() => onChange("")}
      signatureContext="membership-onboarding"
      submitLabel={submitLabel}
      showStatusToast={showStatusToast}
    />
  );
}
