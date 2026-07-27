import { z } from "zod";

const messageSchema = {
  applicationId: z.string().min(1),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10_000),
};

export const applicationDecisionInputSchema = z.discriminatedUnion("decision", [
  z.object({
    ...messageSchema,
    decision: z.literal("accepted"),
    yfnEmail: z.string().trim().email().max(320),
  }),
  z.object({
    ...messageSchema,
    decision: z.literal("rejected"),
  }),
]);

export type ApplicationDecisionInput = z.input<
  typeof applicationDecisionInputSchema
>;

export type ParsedApplicationDecision = z.output<
  typeof applicationDecisionInputSchema
>;
