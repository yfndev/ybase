"use client";

import { useParams } from "next/navigation";
import { AllowanceFormView } from "./_components/AllowanceFormView";
import {
  InvalidLinkScreen,
  LoadingScreen,
  SubmittedScreen,
} from "./_components/StatusScreens";
import { useAllowanceForm } from "./_components/useAllowanceForm";

export default function ExternalEhrenamtspauschalePage() {
  const { id } = useParams<{ id: string }>();
  const {
    linkData,
    form,
    submitted,
    isSubmitting,
    signatureStorageId,
    setSignatureStorageId,
    updateField,
    updateAmount,
    uploadSignature,
    handleSubmit,
  } = useAllowanceForm(id);

  if (!linkData) return <LoadingScreen />;
  if (!linkData.valid) return <InvalidLinkScreen error={linkData.error} />;
  if (submitted) return <SubmittedScreen />;

  return (
    <AllowanceFormView
      linkData={linkData}
      form={form}
      isSubmitting={isSubmitting}
      signatureStorageId={signatureStorageId}
      setSignatureStorageId={setSignatureStorageId}
      updateField={updateField}
      updateAmount={updateAmount}
      uploadSignature={uploadSignature}
      handleSubmit={handleSubmit}
    />
  );
}
