import { buildPaymentReference } from "../../lib/fileHandlers/buildPaymentReference";
import type { Allowance, Reimbursement, SelectionKey } from "./types";

type PaymentSelection = {
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  selected: Set<SelectionKey>;
};

export function buildApprovedPayments({
  reimbursements,
  allowances,
  selected,
}: PaymentSelection) {
  const hasSelection = selected.size > 0;
  const sources = [
    ...reimbursements.map((item) => ({ key: `r:${item._id}` as const, item })),
    ...allowances.map((item) => ({ key: `a:${item._id}` as const, item })),
  ];

  return sources
    .filter(
      ({ key, item }) =>
        (!hasSelection || selected.has(key)) &&
        item.status === "approved" &&
        Boolean(item.iban && item.accountHolder),
    )
    .map(({ item }) => ({
      id: item._id,
      name: item.accountHolder,
      iban: item.iban,
      bic: item.bic,
      amount: item.amount,
      currency: "currency" in item ? (item.currency ?? "EUR") : "EUR",
      reference: buildPaymentReference({
        reimbursementId: item._id,
        projectName: item.projectName,
        name:
          "volunteerName" in item
            ? item.volunteerName || item.creatorName
            : item.submitterName || item.creatorName,
      }),
    }));
}
