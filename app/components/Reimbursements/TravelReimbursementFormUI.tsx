"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { SelectProject } from "@/components/Selectors/SelectProject";
import { Label } from "@/components/ui/label";
import type { Project, ProjectTravelDefaults } from "@/lib/db/types";
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

  const handleProjectChange = (
    value: string,
    selectedProject: ProjectTravelDefaults | undefined = projects.find(
      (project) => project._id === value,
    ),
  ) => {
    form.setProjectId(value || null);
    if (!value) return;
    form.update({
      destination: selectedProject?.travelDestination ?? "",
      purpose: selectedProject?.travelPurpose ?? "",
    });
  };

  return (
    <div className="p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-10">
      <div className="space-y-8 min-w-0">
        <div className="w-full sm:w-[260px]">
          <Label>Projekt *</Label>
          <SelectProject
            value={form.projectId || ""}
            onValueChange={handleProjectChange}
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
          <>
            <BankDetailsEditor value={form.bank} onChange={form.setBank} />
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Unterschrift *</h2>
              <SignatureField
                onSignatureComplete={form.setSignature}
                storageId={form.signature || undefined}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 xl:mt-0 xl:sticky xl:top-6">
        <SummarySection
          receipts={form.receipts}
          totalNet={form.totalNet}
          taxByRate={form.taxByRate}
          mealTotal={form.mealTotal}
          total={form.total}
          isSubmitting={form.isSubmitting}
          canSubmit={!!form.canSubmit}
          handleSubmit={form.handleSubmit}
        />
      </div>
    </div>
  );
}
