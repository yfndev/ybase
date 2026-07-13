import { z } from "zod";
import { BIC_REGEX, IBAN_REGEX, normalizeIban } from "../bank-utils";

const ibanSchema = z
  .string()
  .transform(normalizeIban)
  .pipe(z.string().regex(IBAN_REGEX, "Ungültige IBAN"));

const bicSchema = z
  .string()
  .transform((bic) => bic.replace(/\s/g, "").toUpperCase())
  .refine((bic) => !bic || BIC_REGEX.test(bic), "Ungültige BIC");

export const bankDetailsFields = {
  iban: ibanSchema,
  bic: bicSchema.optional(),
  accountHolder: z.string().trim().min(1, "Bitte Kontoinhaber eingeben"),
};

export const bankDetailsSchema = z.object(bankDetailsFields);
