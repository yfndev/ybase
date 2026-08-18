import { membershipEvents } from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import { newId } from "../../db/ids";
import type { MembershipEvent } from "../../db/types";

type EventInput = Omit<
  MembershipEvent,
  "_id" | "_creationTime" | "occurredAt"
> & { occurredAt?: number };

export async function appendMembershipEvent(input: EventInput): Promise<void> {
  const now = input.occurredAt ?? Date.now();
  try {
    await (
      await membershipEvents()
    ).insertOne({
      ...input,
      _id: newId(),
      _creationTime: now,
      occurredAt: now,
    });
  } catch (error) {
    if (input.idempotencyKey && isDuplicateKeyError(error)) return;
    throw error;
  }
}
