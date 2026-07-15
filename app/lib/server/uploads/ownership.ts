import { uploadOwnerships } from "../../db/collections";
import type { UploadContextType } from "../../db/types";

type UploadOwner = {
	organizationId: string;
	userId: string;
	contextType: UploadContextType;
	contextId: string;
};

type UploadClaim = {
	type: "reimbursement" | "allowance" | "signatureToken";
	id: string;
};

export async function registerPendingUpload(
	storageKey: string,
	owner: UploadOwner,
): Promise<void> {
	await (await uploadOwnerships()).insertOne({
		_id: storageKey,
		_creationTime: Date.now(),
		organizationId: owner.organizationId,
		userId: owner.userId,
		contextType: owner.contextType,
		contextId: owner.contextId,
	});
}

export async function claimPendingUploads(
	storageKeys: string[],
	owner: Pick<UploadOwner, "organizationId" | "userId">,
	allowedContexts: UploadContextType[],
	claim: UploadClaim,
	contextId?: string,
): Promise<void> {
	const uniqueKeys = [...new Set(storageKeys)];
	const claimedKeys: string[] = [];

	try {
		for (const storageKey of uniqueKeys) {
			const result = await (await uploadOwnerships()).updateOne(
				{
					_id: storageKey,
					organizationId: owner.organizationId,
					userId: owner.userId,
					contextType: { $in: allowedContexts },
					...(contextId ? { contextId } : {}),
					claimedAt: { $exists: false },
				},
				{
					$set: {
						claimedByType: claim.type,
						claimedById: claim.id,
						claimedAt: Date.now(),
					},
				},
			);

			if (result.modifiedCount !== 1) {
				throw new Error("Upload does not belong to the current user");
			}
			claimedKeys.push(storageKey);
		}
	} catch (error) {
		if (claimedKeys.length > 0) {
			await (await uploadOwnerships()).updateMany(
				{
					_id: { $in: claimedKeys },
					claimedByType: claim.type,
					claimedById: claim.id,
				},
				{
					$unset: {
						claimedByType: "",
						claimedById: "",
						claimedAt: "",
					},
				},
			);
		}
		throw error;
	}
}

export async function userOwnsUpload(
	storageKey: string,
	organizationId: string,
	userId: string,
): Promise<boolean> {
	const upload = await (await uploadOwnerships()).findOne({
		_id: storageKey,
		organizationId,
		userId,
	});
	return Boolean(upload);
}

export async function contextOwnsUpload(
	storageKey: string,
	organizationId: string,
	contextType: UploadContextType,
	contextId: string,
): Promise<boolean> {
	const upload = await (await uploadOwnerships()).findOne({
		_id: storageKey,
		organizationId,
		contextType,
		contextId,
	});
	return Boolean(upload);
}
