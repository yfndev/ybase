import { PageHeader } from "@/components/Layout/PageHeader";
import {
  getFileInfo,
  getReceipts,
  getReimbursement,
} from "@/lib/server/reimbursements/data";
import { BankDetailsCard } from "./_components/BankDetailsCard";
import { ReceiptList } from "./_components/ReceiptList";
import { ReimbursementSummary } from "./_components/ReimbursementSummary";
import { RejectionNote } from "./_components/RejectionNote";
import { sumGross } from "./_components/totals";
import { TotalsSummary } from "./_components/TotalsSummary";
import { TravelDetailsCard } from "./_components/TravelDetailsCard";

export default async function ReimbursementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reimbursement = await getReimbursement(id);
  const rawReceipts = reimbursement ? await getReceipts(id) : [];
  const receipts = await Promise.all(
    rawReceipts.map(async (receipt) => {
      const file = receipt.fileStorageId
        ? await getFileInfo(receipt.fileStorageId)
        : null;
      return {
        ...receipt,
        fileUrl: file?.url ?? null,
        fileContentType: file?.contentType ?? null,
      };
    }),
  );

  if (!reimbursement) {
    return (
      <div className="flex flex-col w-full h-screen">
        <PageHeader title="Erstattung" showBackButton />
        <div className="p-6">Nicht gefunden.</div>
      </div>
    );
  }

  const receiptTotal = sumGross(receipts);
  const totalGross =
    reimbursement.type === "travel" ? reimbursement.amount : receiptTotal;

  return (
    <div className="flex flex-col w-full h-screen">
      <PageHeader title="Erstattung" showBackButton />

      <div className="max-w-[1024px] p-6 space-y-8">
        <ReimbursementSummary
          reimbursement={reimbursement}
          totalGross={totalGross}
        />

        {reimbursement.rejectionNote && (
          <RejectionNote note={reimbursement.rejectionNote} />
        )}

        {reimbursement.reviewNote && (
          <RejectionNote note={reimbursement.reviewNote} changesRequested />
        )}

        {reimbursement.travelDetails && (
          <TravelDetailsCard travelDetails={reimbursement.travelDetails} />
        )}

        <BankDetailsCard reimbursement={reimbursement} />

        <ReceiptList receipts={receipts} />

        <TotalsSummary
          receipts={receipts}
          reimbursementTotal={reimbursement.amount}
        />
      </div>
    </div>
  );
}
