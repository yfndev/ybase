"use client";

import { SelectProject } from "@/components/Selectors/SelectProject";
import { Label } from "@/components/ui/label";
import type { Project } from "@/lib/db/types";
import { ReceiptsSection } from "./travelForm/ReceiptsSection";
import { SummarySection } from "./travelForm/SummarySection";
import { TravelDetailsSection } from "./travelForm/TravelDetailsSection";
import type { BankDetails } from "./travelForm/types";
import { useTravelForm } from "./travelForm/useTravelForm";

interface Props {
  defaultBankDetails: BankDetails;
  projects: Project[];
}

export function TravelReimbursementFormUI({
  defaultBankDetails,
  projects,
}: Props) {
  const form = useTravelForm(defaultBankDetails);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="w-[200px]">
        <Label>Projekt *</Label>
        <SelectProject
          value={form.projectId || ""}
          onValueChange={(value) => form.setProjectId(value || null)}
          projects={projects}
        />
      </div>

      <TravelDetailsSection travel={form.travel} update={form.update} />

      {form.hasBasicInfo && (
        <ReceiptsSection
          receipts={form.receipts}
          hasReceipt={form.hasReceipt}
          toggleType={form.toggleType}
          updateReceipt={form.updateReceipt}
          travel={form.travel}
          update={form.update}
          showMealAllowance={form.showMealAllowance}
          setShowMealAllowance={form.setShowMealAllowance}
          mealTotal={form.mealTotal}
        />
      )}

      {form.canSubmit && (
        <SummarySection
          bank={form.bank}
          setBank={form.setBank}
          receipts={form.receipts}
          totalNet={form.totalNet}
          taxByRate={form.taxByRate}
          mealTotal={form.mealTotal}
          total={form.total}
          signature={form.signature}
          setSignature={form.setSignature}
          handleSubmit={form.handleSubmit}
        />
      )}
    </div>
  );
}
