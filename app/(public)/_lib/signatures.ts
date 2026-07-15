import { CONNECTION_ERROR, postJson } from "./http";

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

export function submitSign(token: string) {
	return postJson(`/api/public/sign/${token}/submit`, {});
}

export type SignStatus = {
	signatureStorageId: string | null;
	usedAt: number | null;
} | null;

export async function signStatus(token: string): Promise<SignStatus> {
	const response = await fetch(`/api/public/sign/${token}/status`);
	return response.json();
}
