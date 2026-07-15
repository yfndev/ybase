import { z } from "zod";
import {
  getTravelDateRangeError,
  TRAVEL_DATE_RANGE_ERROR,
} from "../../travelDates";
import { bankDetailsFields } from "../bankDetails";

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

export const receiptSchema = z.object(baseReceiptFields);

export const travelReceiptSchema = z.object({
  ...baseReceiptFields,
  costType: z.enum(["car", "train", "flight", "taxi", "bus", "accommodation"]),
  kilometers: z.number().optional(),
});

export const createReimbursementSchema = z.object({
  amount: z.number(),
  projectId: z.string(),
  ...bankDetailsFields,
  currency: z.string().optional(),
  signatureStorageId: z.string(),
  receipts: z.array(receiptSchema),
});

export const createTravelReimbursementSchema = z
  .object({
    amount: z.number(),
    projectId: z.string(),
    ...bankDetailsFields,
    currency: z.string().optional(),
    signatureStorageId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    destination: z.string(),
    purpose: z.string(),
    isInternational: z.boolean(),
    mealAllowanceDays: z.number().optional(),
    mealAllowanceDailyBudget: z.number().optional(),
    receipts: z.array(travelReceiptSchema),
  })
  .refine((data) => !getTravelDateRangeError(data.startDate, data.endDate), {
    message: TRAVEL_DATE_RANGE_ERROR,
    path: ["endDate"],
  });

export const createLinkSchema = z.object({
  projectId: z.string(),
  type: z.enum(["expense", "travel"]),
  description: z.string().optional(),
  invitedName: z.string().trim().optional(),
  invitedEmail: z.string().email().optional(),
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

export const publicReimbursementSubmissionSchema = z.object({
  amount: z.number(),
  iban: z.string(),
  bic: z.string(),
  accountHolder: z.string(),
  submitterName: z.string(),
  submitterEmail: z.string().email(),
  signatureStorageId: z.string(),
  receipts: z.array(receiptSchema),
  travelReceipts: z.array(travelReceiptSchema).optional(),
  travelDetails: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
      destination: z.string(),
      purpose: z.string(),
      isInternational: z.boolean(),
      mealAllowanceDays: z.number().optional(),
      mealAllowanceDailyBudget: z.number().optional(),
    })
    .refine((data) => !getTravelDateRangeError(data.startDate, data.endDate), {
      message: TRAVEL_DATE_RANGE_ERROR,
      path: ["endDate"],
    })
    .optional(),
});
