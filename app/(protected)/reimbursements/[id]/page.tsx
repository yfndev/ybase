import { PageHeader } from "@/components/Layout/PageHeader";
import {
  getFileUrl,
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
    rawReceipts.map(async (receipt) => ({
      ...receipt,
      fileUrl: await getFileUrl(receipt.fileStorageId),
    })),
  );

  if (!reimbursement) {
    return (
      <div className="flex flex-col w-full h-screen">
        <PageHeader title="Erstattung" showBackButton />
        <div className="p-6">Nicht gefunden.</div>
      </div>
    );
  }

  const totalGross = sumGross(receipts);

  return (
    <div className="flex flex-col w-full h-screen">
      <PageHeader title="Erstattung" showBackButton />

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <ReimbursementSummary
          reimbursement={reimbursement}
          totalGross={totalGross}
        />

        {reimbursement.rejectionNote && (
          <RejectionNote note={reimbursement.rejectionNote} />
        )}

        {reimbursement.travelDetails && (
          <TravelDetailsCard travelDetails={reimbursement.travelDetails} />
        )}

        <BankDetailsCard reimbursement={reimbursement} />

        <ReceiptList receipts={receipts} />

        <TotalsSummary receipts={receipts} />
      </div>
    </div>
  );
}
