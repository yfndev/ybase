import { PageHeader } from "@/components/Layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import {
  getFileUrl,
  getReceipts,
  getReimbursement,
} from "@/lib/server/reimbursements/data";

const COST_TYPE_LABELS: Record<string, string> = {
  car: "PKW",
  train: "Bahn",
  flight: "Flug",
  taxi: "Taxi",
  bus: "Bus",
  accommodation: "Hotel",
};

const STATUS_MAP = {
  pending: { label: "Ausstehend", variant: "secondary" as const },
  approved: { label: "Genehmigt", variant: "default" as const },
  declined: { label: "Abgelehnt", variant: "destructive" as const },
};

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

  const totalNet = receipts.reduce((sum, receipt) => sum + receipt.netAmount, 0);
  const totalGross = receipts.reduce(
    (sum, receipt) => sum + receipt.grossAmount,
    0,
  );
  const taxByRate = (rate: number) =>
    receipts
      .filter((receipt) => receipt.taxRate === rate)
      .reduce((sum, receipt) => sum + receipt.grossAmount - receipt.netAmount, 0);

  const { label: statusLabel, variant: statusVariant } =
    STATUS_MAP[reimbursement.status] ?? STATUS_MAP.pending;

  return (
    <div className="flex flex-col w-full h-screen">
      <PageHeader title="Erstattung" showBackButton />

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <span className="text-muted-foreground">
              {reimbursement.type === "travel"
                ? "Reisekostenerstattung"
                : "Auslagenerstattung"}
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalGross)}</p>
        </div>

        {reimbursement.rejectionNote && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800">Ablehnungsgrund:</p>
            <p className="text-red-700">{reimbursement.rejectionNote}</p>
          </div>
        )}

        {reimbursement.travelDetails && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Reisedetails</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Reiseziel:</span>
                {reimbursement.travelDetails.destination}
              </div>
              <div>
                <span className="text-muted-foreground">Zweck:</span>
                {reimbursement.travelDetails.purpose}
              </div>
              <div>
                <span className="text-muted-foreground">Zeitraum:</span>
                {formatDate(reimbursement.travelDetails.startDate)} –
                {formatDate(reimbursement.travelDetails.endDate)}
              </div>
              {reimbursement.travelDetails.isInternational && (
                <div>
                  <Badge variant="outline">Auslandsreise</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h3 className="font-medium">Bankverbindung</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Kontoinhaber:</span>
              {reimbursement.accountHolder || "–"}
            </div>
            <div>
              <span className="text-muted-foreground">IBAN:</span>
              <span className="font-mono">{reimbursement.iban || "–"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">BIC:</span>
              <span className="font-mono">{reimbursement.bic || "–"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Belege ({receipts.length})</h3>
          {receipts.map((receipt) => (
            <div key={receipt._id} className="border rounded-lg p-4 flex gap-4">
              <img
                src={receipt.fileUrl}
                alt="Beleg"
                className="w-32 h-32 object-cover rounded border"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{receipt.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Beleg-Nr. {receipt.receiptNumber} •
                      {formatDate(receipt.receiptDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(receipt.grossAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(receipt.netAmount)} netto +
                      {receipt.taxRate}% USt
                    </p>
                  </div>
                </div>
                {receipt.description && (
                  <p className="text-sm text-muted-foreground">
                    {receipt.description}
                  </p>
                )}
                {receipt.costType && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {COST_TYPE_LABELS[receipt.costType] || receipt.costType}
                    </Badge>
                    {receipt.kilometers && (
                      <span className="text-sm text-muted-foreground">
                        {receipt.kilometers} km × 0,30€
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Netto gesamt</span>
            <span>{formatCurrency(totalNet)}</span>
          </div>
          {taxByRate(0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">USt 0%</span>
              <span>{formatCurrency(taxByRate(0))}</span>
            </div>
          )}
          {taxByRate(7) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">USt 7%</span>
              <span>{formatCurrency(taxByRate(7))}</span>
            </div>
          )}
          {taxByRate(19) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">USt 19%</span>
              <span>{formatCurrency(taxByRate(19))}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Brutto gesamt</span>
            <span>{formatCurrency(totalGross)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
