import { CONNECTION_ERROR, postJson } from "./http";

export type ReimbursementLink =
  | { valid: false; error: string }
  | {
      valid: true;
      type: "expense" | "travel";
      organizationName: string;
      projectName: string;
      invitedName?: string;
      invitedEmail?: string;
      changesRequested?: string;
      travelDetails: {
        destination: string;
        purpose: string;
        startDate: string;
        startTime?: string;
        endDate: string;
        endTime?: string;
        allowFoodAllowance?: boolean;
        isInternational?: boolean;
        mealAllowanceDays?: number;
        mealAllowanceDailyBudget?: number;
        mealAllowance?: {
          singleDay: { days: number; rate: number };
          arrivalDay: { days: number; rate: number };
          fullDay: { days: number; rate: number };
          departureDay: { days: number; rate: number };
        };
        overnightAllowanceNights?: number;
        overnightAllowanceRate?: number;
      } | null;
      submission?: {
        name: string;
        email: string;
        iban: string;
        bic: string;
        accountHolder: string;
        signatureStorageId: string | null;
        receipts: Array<{
          receiptNumber?: string;
          receiptDate: string;
          companyName: string;
          description: string;
          netAmount: number;
          taxRate: number;
          grossAmount: number;
          fileStorageId?: string;
          costType?:
            | "car"
            | "train"
            | "flight"
            | "taxi"
            | "bus"
            | "accommodation"
            | "incidental";
          kilometers?: number;
        }>;
      };
    };

export async function validateReimbursementLink(
  id: string,
): Promise<ReimbursementLink> {
  try {
    const response = await fetch(`/api/public/reimbursement/${id}`);
    return await response.json();
  } catch {
    return { valid: false, error: CONNECTION_ERROR };
  }
}

export function reimbursementUploadUrl(id: string, contentType: string) {
  return postJson(`/api/public/reimbursement/${id}/upload-url`, {
    contentType,
  }) as Promise<{ key: string; url: string }>;
}

export async function reimbursementFileUrl(
  id: string,
  key: string,
): Promise<string | null> {
  const { url } = await postJson(`/api/public/reimbursement/${id}/file-url`, {
    key,
  });
  return url ?? null;
}

export function submitReimbursement(id: string, body: unknown) {
  return postJson(`/api/public/reimbursement/${id}/submit`, body);
}
