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

const travelReceiptValidator = z
  .object({
    ...baseReceiptFields,
    fileStorageId: z.string().optional(),
    costType: z.enum([
      "car",
      "train",
      "flight",
      "taxi",
      "bus",
      "accommodation",
      "incidental",
    ]),
    kilometers: z.number().optional(),
  })
  .superRefine((receipt, context) => {
    if (receipt.costType === "car") {
      const kilometers = receipt.kilometers ?? 0;
      if (kilometers <= 0) {
        context.addIssue({
          code: "custom",
          path: ["kilometers"],
          message: "Kilometer erforderlich",
        });
      }
      const expected = Math.round(kilometers * 30) / 100;
      if (receipt.grossAmount !== expected || receipt.netAmount !== expected) {
        context.addIssue({
          code: "custom",
          path: ["grossAmount"],
          message: "Ungültige Kilometerpauschale",
        });
      }
      return;
    }
    if (!receipt.companyName.trim()) {
      context.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Anbieter erforderlich",
      });
    }
    if (!receipt.fileStorageId) {
      context.addIssue({
        code: "custom",
        path: ["fileStorageId"],
        message: "Beleg erforderlich",
      });
    }
  });

const mealAllowanceLineValidator = z.object({
  days: z.number().int().min(0),
  rate: z.number().min(0),
});

const mealAllowanceValidator = z.object({
  singleDay: mealAllowanceLineValidator,
  arrivalDay: mealAllowanceLineValidator,
  fullDay: mealAllowanceLineValidator,
  departureDay: mealAllowanceLineValidator,
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
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endDate: z.string(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    destination: z.string(),
    purpose: z.string(),
    isInternational: z.boolean(),
    mealAllowanceDays: z.number().optional(),
    mealAllowanceDailyBudget: z.number().optional(),
    mealAllowance: mealAllowanceValidator.optional(),
    overnightAllowanceNights: z.number().int().min(0).optional(),
    overnightAllowanceRate: z.number().min(0).optional(),
    receipts: z.array(travelReceiptValidator),
  })
  .refine(
    (data) =>
      !getTravelDateRangeError(
        data.startDate,
        data.endDate,
        data.startTime,
        data.endTime,
      ),
    {
      message: TRAVEL_DATE_RANGE_ERROR,
      path: ["endDate"],
    },
  );

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
