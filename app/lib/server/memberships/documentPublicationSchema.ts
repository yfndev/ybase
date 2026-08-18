import { z } from "zod";
import { MEMBERSHIP_DOCUMENT_ORDER } from "../../members/documents";

const documentFields = {
  kind: z.enum(MEMBERSHIP_DOCUMENT_ORDER),
  title: z.string().trim().min(2).max(150),
  versionLabel: z.string().trim().min(1).max(50),
  content: z.string().min(1),
  targetTeamIds: z.array(z.string().min(1)).default([]),
  targetDepartmentIds: z.array(z.string().min(1)).default([]),
};

function validateTargets(
  document: {
    kind: string;
    targetTeamIds: string[];
    targetDepartmentIds: string[];
  },
  context: z.RefinementCtx,
) {
  if (
    document.kind === "usage_rights" &&
    document.targetTeamIds.length === 0 &&
    document.targetDepartmentIds.length === 0
  ) {
    context.addIssue({
      code: "custom",
      path: ["targetDepartmentIds"],
      message:
        "Die Sondervereinbarung braucht mindestens ein Ziel-Department oder Team.",
    });
  }
}

export const publicationSchema = z
  .object(documentFields)
  .superRefine(validateTargets);

export const documentUpdateSchema = z
  .object({ versionId: z.string().min(1), ...documentFields })
  .superRefine(validateTargets);
