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

const receiptValidator = z.object(baseReceiptFields);

const travelReceiptValidator = z.object({
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
  receipts: z.array(receiptValidator),
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
    receipts: z.array(travelReceiptValidator),
  })
  .refine((data) => !getTravelDateRangeError(data.startDate, data.endDate), {
    message: TRAVEL_DATE_RANGE_ERROR,
    path: ["endDate"],
  });

export const createLinkSchema = z.object({
  projectId: z.string(),
  type: z.enum(["expense", "travel"]),
  invitedName: z.string().trim().optional(),
  invitedEmail: z.string().email().optional(),
  travelDetails: z
    .object({
      destination: z.string().optional(),
      purpose: z.string().optional(),
      allowFoodAllowance: z.boolean().optional(),
    })
    .optional(),
});
