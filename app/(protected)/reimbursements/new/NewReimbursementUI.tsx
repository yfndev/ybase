"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { ReimbursementFormUI } from "@/components/Reimbursements/ReimbursementFormUI";
import { TravelReimbursementFormUI } from "@/components/Reimbursements/TravelReimbursementFormUI";
import { VolunteerAllowanceFormUI } from "@/components/Reimbursements/VolunteerAllowanceFormUI";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/lib/db/types";
import { useState } from "react";

type ReimbursementType = "expense" | "travel" | "volunteerAllowance";
type BankDetails = { iban: string; bic: string; accountHolder: string };

interface Props {
  defaultBankDetails: BankDetails;
  projects: Project[];
}

export function NewReimbursementUI({ defaultBankDetails, projects }: Props) {
  const [type, setType] = useState<ReimbursementType>("expense");

  return (
    <div>
      <PageHeader title="Neue Erstattung" showBackButton />
      <div className="max-w-4xl mx-auto p-6">
        <Tabs
          value={type}
          onValueChange={(value) => setType(value as ReimbursementType)}
        >
          <TabsList>
            <TabsTrigger value="expense">Auslagenerstattung</TabsTrigger>
            <TabsTrigger value="travel">Reisekostenerstattung</TabsTrigger>
            <TabsTrigger value="volunteerAllowance">
              Ehrenamtspauschale
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {type === "travel" && (
        <TravelReimbursementFormUI
          defaultBankDetails={defaultBankDetails}
          projects={projects}
        />
      )}
      {type === "expense" && (
        <ReimbursementFormUI
          defaultBankDetails={defaultBankDetails}
          projects={projects}
        />
      )}
      {type === "volunteerAllowance" && (
        <VolunteerAllowanceFormUI
          defaultBankDetails={defaultBankDetails}
          projects={projects}
        />
      )}
    </div>
  );
}
