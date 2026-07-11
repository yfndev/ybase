"use client";

import { CURRENCY_SYMBOLS } from "@/lib/bank-utils";
import { ProjectCurrencyFields } from "./reimbursementForm/ProjectCurrencyFields";
import { ReceiptDraftFields } from "./reimbursementForm/ReceiptDraftFields";
import { ReimbursementSummary } from "./reimbursementForm/ReimbursementSummary";
import type { Props } from "./reimbursementForm/types";
import { useReimbursementForm } from "./reimbursementForm/useReimbursementForm";

export function ReimbursementFormUI({ defaultBankDetails, projects }: Props) {
  const form = useReimbursementForm(defaultBankDetails);
  const currencySymbol = CURRENCY_SYMBOLS[form.currency] || form.currency;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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
        onAddReceipt={form.addReceipt}
      />

      {form.receipts.length > 0 && (
        <ReimbursementSummary
          receipts={form.receipts}
          currencySymbol={currencySymbol}
          bank={form.bank}
          onBankChange={form.setBank}
          onRemoveReceipt={form.removeReceipt}
          signature={form.signature}
          onSignatureComplete={form.setSignature}
          isSubmitting={form.isSubmitting}
          onSubmit={form.handleSubmit}
        />
      )}
    </div>
  );
}
