import { reimbursementInvites } from "../../db/collections";
import {
  hashReimbursementInviteToken,
  isReimbursementInviteToken,
} from "./token";

export async function isValidReimbursementInvite(
  token: string,
): Promise<boolean> {
  if (!isReimbursementInviteToken(token)) return false;

  const invite = await (
    await reimbursementInvites()
  ).findOne(
    { tokenHash: hashReimbursementInviteToken(token) },
    { projection: { _id: 1 } },
  );
  return Boolean(invite);
}
