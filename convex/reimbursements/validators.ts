import { v } from "convex/values";

const baseReceiptFields = {
  receiptNumber: v.optional(v.string()),
  receiptDate: v.string(),
  companyName: v.string(),
  description: v.string(),
  netAmount: v.number(),
  taxRate: v.number(),
  grossAmount: v.number(),
  fileStorageId: v.id("_storage"),
};

export const receiptValidator = v.object(baseReceiptFields);

export const travelReceiptValidator = v.object({
  ...baseReceiptFields,
  costType: v.union(
    v.literal("car"),
    v.literal("train"),
    v.literal("flight"),
    v.literal("taxi"),
    v.literal("bus"),
    v.literal("accommodation"),
  ),
  kilometers: v.optional(v.number()),
});
