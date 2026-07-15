import {
  getTravelDateRangeError,
  TRAVEL_DATE_RANGE_ERROR,
} from "@/lib/travelDates";
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

const receiptSchema = z.object(baseReceiptFields);

const travelReceiptSchema = z
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

const mealLine = z.object({
  days: z.number().int().min(0),
  rate: z.number().min(0),
});

export const bodySchema = z.object({
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
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endDate: z.string(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      destination: z.string(),
      purpose: z.string(),
      isInternational: z.boolean(),
      mealAllowanceDays: z.number().optional(),
      mealAllowanceDailyBudget: z.number().optional(),
      mealAllowance: z
        .object({
          singleDay: mealLine,
          arrivalDay: mealLine,
          fullDay: mealLine,
          departureDay: mealLine,
        })
        .optional(),
      overnightAllowanceNights: z.number().int().min(0).optional(),
      overnightAllowanceRate: z.number().min(0).optional(),
    })
    .refine(
      (data) =>
        !getTravelDateRangeError(
          data.startDate,
          data.endDate,
          data.startTime,
          data.endTime,
        ),
      { message: TRAVEL_DATE_RANGE_ERROR, path: ["endDate"] },
    )
    .optional(),
});
