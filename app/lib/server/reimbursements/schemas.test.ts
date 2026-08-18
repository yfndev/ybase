import { expect, test } from "vitest";
import { travelReceiptSchema } from "./schemas";

const carReceipt = {
  costType: "car" as const,
  receiptDate: "2026-08-15",
  companyName: "Privater PKW",
  description: "",
  netAmount: 15,
  taxRate: 0,
  grossAmount: 15,
  kilometers: 100,
};

test("accepts only the fixed 15 cent car allowance rate", () => {
  expect(travelReceiptSchema.safeParse(carReceipt).success).toBe(true);
  expect(
    travelReceiptSchema.safeParse({ ...carReceipt, mileageRate: 0.15 }).success,
  ).toBe(true);
  expect(
    travelReceiptSchema.safeParse({
      ...carReceipt,
      mileageRate: 0.3,
      netAmount: 30,
      grossAmount: 30,
    }).success,
  ).toBe(false);
});
