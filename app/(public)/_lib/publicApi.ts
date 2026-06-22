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
      description?: string;
      travelDetails: { allowFoodAllowance?: boolean } | null;
    };

export async function validateReimbursementLink(
  id: string,
): Promise<ReimbursementLink> {
  const response = await fetch(`/api/public/reimbursement/${id}`);
  return response.json();
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
    };

export async function validateAllowanceLink(
  id: string,
): Promise<AllowanceLink> {
  const response = await fetch(`/api/public/allowance/${id}`);
  return response.json();
}

export function submitAllowance(id: string, body: unknown) {
  return postJson(`/api/public/allowance/${id}/submit`, body);
}

export type SignValidation = { valid: false; error: string } | { valid: true };

export async function validateSignToken(
  token: string,
): Promise<SignValidation> {
  const response = await fetch(`/api/public/sign/${token}`);
  return response.json();
}

export function submitSign(token: string, signatureStorageId: string) {
  return postJson(`/api/public/sign/${token}/submit`, { signatureStorageId });
}
