import { z } from "zod";

const baseReceiptFields = {
  receiptNumber: z.string().optional(),
  receiptDate: z.string(),
  companyName: z.string(),
  description: z.string(),
  netAmount: z.number(),
  taxRate: z.number(),
  grossAmount: z.number(),
  fileStorageId: z.string(),
};

const receiptValidator = z.object(baseReceiptFields);

const travelReceiptValidator = z.object({
  ...baseReceiptFields,
  costType: z.enum(["car", "train", "flight", "taxi", "bus", "accommodation"]),
  kilometers: z.number().optional(),
});

export const createReimbursementSchema = z.object({
  amount: z.number(),
  projectId: z.string(),
  iban: z.string(),
  bic: z.string().optional(),
  accountHolder: z.string(),
  currency: z.string().optional(),
  signatureStorageId: z.string(),
  receipts: z.array(receiptValidator),
});

export const createTravelReimbursementSchema = z.object({
  amount: z.number(),
  projectId: z.string(),
  iban: z.string(),
  bic: z.string().optional(),
  accountHolder: z.string(),
  currency: z.string().optional(),
  signatureStorageId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  destination: z.string(),
  purpose: z.string(),
  isInternational: z.boolean(),
  mealAllowanceDays: z.number().optional(),
  mealAllowanceDailyBudget: z.number().optional(),
  receipts: z.array(travelReceiptValidator),
});

export const createLinkSchema = z.object({
  projectId: z.string(),
  type: z.enum(["expense", "travel"]),
  description: z.string().optional(),
  travelDetails: z
    .object({
      destination: z.string().optional(),
      purpose: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      allowFoodAllowance: z.boolean().optional(),
    })
    .optional(),
});

export const sendLinkSchema = z.object({
  email: z.string(),
  link: z.string(),
  projectName: z.string(),
  type: z.enum(["expense", "travel"]),
});
