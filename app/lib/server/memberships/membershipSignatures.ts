import type { User } from "../../db/types";
import { getObjectBuffer, getObjectSize } from "../../s3/storage";
import type { UploadClaim } from "../uploads/ownership";
import {
  claimSignatureForSubmission,
  userOwnsUpload,
} from "../uploads/ownership";
import { validateSignaturePng } from "./signingPdf";

type MembershipSignatureActor = Pick<User, "_id"> & {
  organizationId: string;
};

export async function loadAndClaimMembershipSignature(
  storageKey: string,
  actor: MembershipSignatureActor,
  claim: UploadClaim,
): Promise<Uint8Array> {
  const owner = {
    organizationId: actor.organizationId,
    userId: actor._id,
  };
  if (!(await userOwnsUpload(storageKey, owner.organizationId, owner.userId))) {
    throw new Error("Die Unterschrift wurde nicht gefunden.");
  }

  const size = await getObjectSize(storageKey);
  if (size < 100 || size > 500_000) {
    throw new Error("Die Unterschrift ist leer oder zu groß.");
  }
  const signature = validateSignaturePng(await getObjectBuffer(storageKey));
  await claimSignatureForSubmission(storageKey, owner, claim);
  return signature;
}
