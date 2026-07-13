"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { CURRENCY_SYMBOLS } from "@/lib/bank-utils";
import { ProjectCurrencyFields } from "./reimbursementForm/ProjectCurrencyFields";
import { ReceiptDraftFields } from "./reimbursementForm/ReceiptDraftFields";
import { ReimbursementSummary } from "./reimbursementForm/ReimbursementSummary";
import type { Props } from "./reimbursementForm/types";
import { useReimbursementForm } from "./reimbursementForm/useReimbursementForm";

export function ReimbursementFormUI({
  defaultBankDetails,
  projects,
  organizationName,
}: Props) {
  const form = useReimbursementForm(defaultBankDetails);
  const currencySymbol = CURRENCY_SYMBOLS[form.currency] || form.currency;
  const hasReceipts = form.receipts.length > 0;

  return (
    <div className="p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-10">
      <div className="space-y-8 min-w-0">
        <ProjectCurrencyFields
          projects={projects}
          projectId={form.projectId}
          onProjectChange={form.setProjectId}
          currency={form.currency}
          onCurrencyChange={form.setCurrency}
        />

        <ReceiptDraftFields
          draft={form.draft}
          setDraft={form.setDraft}
          currencySymbol={currencySymbol}
          receiptCount={form.receipts.length}
          organizationName={organizationName}
          onAddReceipt={form.addReceipt}
        />

        {hasReceipts && (
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
        <ReimbursementSummary
          receipts={form.receipts}
          currencySymbol={currencySymbol}
          onRemoveReceipt={form.removeReceipt}
          isSubmitting={form.isSubmitting}
          onSubmit={form.handleSubmit}
        />
      </div>
    </div>
  );
}
