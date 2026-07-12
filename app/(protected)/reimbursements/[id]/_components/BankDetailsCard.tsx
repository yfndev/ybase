import type { Reimbursement } from "./types";

export function BankDetailsCard({
  reimbursement,
}: {
  reimbursement: Reimbursement;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <h3 className="font-medium">Bankverbindung</h3>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Kontoinhaber: </span>
          {reimbursement.accountHolder || "–"}
        </div>
        <div>
          <span className="text-muted-foreground">IBAN: </span>
          <span className="font-mono">{reimbursement.iban || "–"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">BIC: </span>
          <span className="font-mono">{reimbursement.bic || "–"}</span>
        </div>
      </div>
    </div>
  );
}
