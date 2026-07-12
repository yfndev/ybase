"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { ActivitySection } from "@/components/Reimbursements/volunteerAllowanceForm/ActivitySection";
import { ConfirmationSection } from "@/components/Reimbursements/volunteerAllowanceForm/ConfirmationSection";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "@/components/Reimbursements/volunteerAllowanceForm/constants";
import { PersonalDataSection } from "@/components/Reimbursements/volunteerAllowanceForm/PersonalDataSection";
import type { Props } from "@/components/Reimbursements/volunteerAllowanceForm/types";
import { useVolunteerAllowanceForm } from "@/components/Reimbursements/volunteerAllowanceForm/useVolunteerAllowanceForm";
import { AmountInput } from "@/components/Selectors/AmountInput";
import { SelectProject } from "@/components/Selectors/SelectProject";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export function VolunteerAllowanceFormUI({
  defaultBankDetails,
  projects,
}: Props) {
  const {
    projectId,
    setProjectId,
    bank,
    setBank,
    signature,
    setSignature,
    form,
    update,
    updateAmount,
    isSubmitting,
    handleSubmit,
  } = useVolunteerAllowanceForm(defaultBankDetails);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="w-full sm:w-[260px]">
        <Label>Projekt *</Label>
        <SelectProject
          value={projectId || ""}
          onValueChange={(value) => setProjectId(value || null)}
          projects={projects}
        />
      </div>

      <PersonalDataSection form={form} update={update} />

      <ActivitySection form={form} update={update} />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Betrag</h2>
        <div className="max-w-xs">
          <Label>Betrag in Euro (max. {MAX_VOLUNTEER_ALLOWANCE_EUR} €) *</Label>
          <AmountInput value={form.amount} onChange={updateAmount} />
        </div>
      </div>

      <BankDetailsEditor value={bank} onChange={setBank} />

      <Separator />

      <ConfirmationSection form={form} update={update} />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Unterschrift *</h2>
        <SignatureField
          onSignatureComplete={setSignature}
          storageId={signature || undefined}
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full h-14 font-semibold mt-8"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
        Zur Genehmigung einreichen
      </Button>
    </div>
  );
}
