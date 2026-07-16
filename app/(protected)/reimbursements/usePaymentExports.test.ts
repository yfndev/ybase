import { describe, expect, test } from "vitest";
import type { Allowance, Reimbursement, SelectionKey } from "./types";
import { buildApprovedPayments } from "./buildApprovedPayments";

const reimbursement = {
  _id: "reimbursement-approved",
  status: "approved",
  iban: "DE111",
  accountHolder: "Alex Example",
  amount: 42,
  currency: "EUR",
  projectName: "Projekt A",
  creatorName: "Alex Example",
} as Reimbursement;

const allowance = {
  _id: "allowance-approved",
  status: "approved",
  iban: "DE222",
  accountHolder: "Sam Example",
  amount: 80,
  projectName: "Projekt B",
  volunteerName: "Sam Example",
  creatorName: "Sam Example",
} as Allowance;

describe("buildApprovedPayments", () => {
  test("includes approved reimbursements and allowances without a selection", () => {
    const payments = buildApprovedPayments({
      reimbursements: [reimbursement],
      allowances: [allowance],
      selected: new Set<SelectionKey>(),
    });

    expect(payments.map(({ id }) => id)).toEqual([
      reimbursement._id,
      allowance._id,
    ]);
  });

  test("limits the export to the current multi-selection", () => {
    const payments = buildApprovedPayments({
      reimbursements: [reimbursement],
      allowances: [allowance],
      selected: new Set<SelectionKey>([`a:${allowance._id}`]),
    });

    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      id: allowance._id,
      name: allowance.accountHolder,
      iban: allowance.iban,
    });
  });

  test("excludes selected payments that are not approved", () => {
    const pending = { ...reimbursement, status: "pending" } as Reimbursement;
    const payments = buildApprovedPayments({
      reimbursements: [pending],
      allowances: [],
      selected: new Set<SelectionKey>([`r:${pending._id}`]),
    });

    expect(payments).toEqual([]);
  });

  test("excludes payments that are already paid", () => {
    const paid = { ...reimbursement, status: "paid" } as Reimbursement;
    const payments = buildApprovedPayments({
      reimbursements: [paid],
      allowances: [],
      selected: new Set<SelectionKey>(),
    });

    expect(payments).toEqual([]);
  });
});
