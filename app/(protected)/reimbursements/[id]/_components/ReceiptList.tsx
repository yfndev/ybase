import { ReceiptCard } from "./ReceiptCard";
import type { ReceiptWithUrl } from "./types";

export function ReceiptList({ receipts }: { receipts: ReceiptWithUrl[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Belege ({receipts.length})</h3>
      {receipts.map((receipt) => (
        <ReceiptCard key={receipt._id} receipt={receipt} />
      ))}
    </div>
  );
}
