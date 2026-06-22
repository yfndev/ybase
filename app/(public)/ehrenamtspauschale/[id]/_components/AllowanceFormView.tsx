"use client";

import { PublicSignaturePad } from "@/(public)/_components/PublicSignaturePad";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { ActivitySection } from "./ActivitySection";
import { AmountSection } from "./AmountSection";
import { BankSection } from "./BankSection";
import { ConfirmationSection } from "./ConfirmationSection";
import { FormHeader } from "./FormHeader";
import { PersonalDataSection } from "./PersonalDataSection";
import type { AllowanceForm, UpdateField, ValidAllowanceLink } from "./types";

type Props = {
  linkData: ValidAllowanceLink;
  form: AllowanceForm;
  isSubmitting: boolean;
  signatureStorageId: string | null;
  setSignatureStorageId: (storageId: string | null) => void;
  updateField: UpdateField;
  updateAmount: (value: string) => void;
  uploadSignature: (blob: Blob) => Promise<string>;
  handleSubmit: () => void;
};

export function AllowanceFormView({
  linkData,
  form,
  isSubmitting,
  signatureStorageId,
  setSignatureStorageId,
  updateField,
  updateAmount,
  uploadSignature,
  handleSubmit,
}: Props) {
  return (
    <div className="min-h-svh py-8">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        <FormHeader linkData={linkData} />
        <PersonalDataSection form={form} updateField={updateField} />
        <ActivitySection form={form} updateField={updateField} />
        <AmountSection
          form={form}
          updateField={updateField}
          updateAmount={updateAmount}
        />
        <BankSection form={form} updateField={updateField} />
        <Separator />
        <ConfirmationSection form={form} updateField={updateField} />

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Unterschrift</h2>
          <PublicSignaturePad
            onUploadComplete={setSignatureStorageId}
            storageId={signatureStorageId || undefined}
            uploadSignature={uploadSignature}
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-14 font-semibold"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
          Einreichen
        </Button>
      </div>
    </div>
  );
}
