import { CONNECTION_ERROR, postJson } from "./http";

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
