import { z } from "zod";
import { bankDetailsFields } from "../server/bankDetails";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "./constants";

export const volunteerAllowanceFields = {
  amount: z.number().max(MAX_VOLUNTEER_ALLOWANCE_EUR),
  ...bankDetailsFields,
  activityDescription: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  taxYear: z.string().optional(),
  volunteerName: z.string(),
  volunteerStreet: z.string(),
  volunteerPlz: z.string(),
  volunteerCity: z.string(),
  signatureStorageId: z.string(),
};

export const volunteerAllowanceSubmissionSchema = z.object({
  ...volunteerAllowanceFields,
  submitterEmail: z.string().email(),
});
