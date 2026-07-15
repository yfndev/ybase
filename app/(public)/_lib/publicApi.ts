const CONNECTION_ERROR =
  "Verbindung fehlgeschlagen. Bitte versuche es später erneut.";

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Fehler");
  return data;
}

export async function uploadViaPresign(
  url: string,
  body: { contentType: string },
  file: Blob,
): Promise<string> {
  const { key, url: putUrl } = await postJson(url, body);
  const result = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": body.contentType },
    body: file,
  });
  if (!result.ok) throw new Error("Upload fehlgeschlagen");
  return key;
}

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
        endDate: string;
        allowFoodAllowance?: boolean;
        isInternational?: boolean;
        mealAllowanceDays?: number;
        mealAllowanceDailyBudget?: number;
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
          fileStorageId: string;
          costType?:
            | "car"
            | "train"
            | "flight"
            | "taxi"
            | "bus"
            | "accommodation";
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

export type AllowanceLink =
  | { valid: false; error: string }
  | {
      valid: true;
      organizationName: string;
      organizationStreet: string;
      organizationPlz: string;
      organizationCity: string;
      projectName: string;
      activityDescription: string;
      startDate: string;
      endDate: string;
      invitedName?: string;
      invitedEmail?: string;
      changesRequested?: string;
      submission?: {
        volunteerName: string;
        submitterEmail: string;
        volunteerStreet: string;
        volunteerPlz: string;
        volunteerCity: string;
        amount: number;
        iban: string;
        bic: string;
        accountHolder: string;
        taxYear: string;
        signatureStorageId: string | null;
      };
    };

export async function validateAllowanceLink(
  id: string,
): Promise<AllowanceLink> {
  try {
    const response = await fetch(`/api/public/allowance/${id}`);
    return await response.json();
  } catch {
    return { valid: false, error: CONNECTION_ERROR };
  }
}

export function submitAllowance(id: string, body: unknown) {
  return postJson(`/api/public/allowance/${id}/submit`, body);
}

export type SignValidation = { valid: false; error: string } | { valid: true };

export async function validateSignToken(
  token: string,
): Promise<SignValidation> {
  try {
    const response = await fetch(`/api/public/sign/${token}`);
    return await response.json();
  } catch {
    return { valid: false, error: CONNECTION_ERROR };
  }
}

export function submitSign(token: string, signatureStorageId: string) {
  return postJson(`/api/public/sign/${token}/submit`, { signatureStorageId });
}

export type SignStatus = {
  signatureStorageId: string | null;
  usedAt: number | null;
} | null;

export async function signStatus(token: string): Promise<SignStatus> {
  const response = await fetch(`/api/public/sign/${token}/status`);
  return response.json();
}
