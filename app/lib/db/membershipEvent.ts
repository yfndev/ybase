export interface MembershipEvent {
  _id: string;
  _creationTime: number;
  organizationId: string;
  membershipId: string;
  caseId?: string;
  userId: string;
  actorUserId?: string;
  actorType: "user" | "system" | "public_link" | "integration";
  type: string;
  idempotencyKey?: string;
  occurredAt: number;
  details: Record<string, string | number | boolean | null>;
}
