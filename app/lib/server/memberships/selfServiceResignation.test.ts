import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("./requestMetadata", () => ({ membershipRequestMetadata: vi.fn() }));
vi.mock("./resignationEmail", () => ({
  sendGuardianResignationRequest: vi.fn(),
  sendResignationConfirmation: vi.fn(),
}));

import { requireUser } from "../../auth/session";
import {
  membershipEvents,
  membershipResignationRequests,
  memberships,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership } from "../../db/types";
import { parseBerlinDate } from "../../members/berlinDate";
import { resignationEndAt } from "../../members/legalDates";
import { createTestActor, type TestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  confirmGuardianResignation,
  getGuardianResignationRequest,
} from "./guardianResignation";
import {
  sendGuardianResignationRequest,
  sendResignationConfirmation,
} from "./resignationEmail";
import { RESIGNATION_DECLARATION_TEXT } from "./resignationDeclaration";
import { membershipRequestMetadata } from "./requestMetadata";
import { requestOwnMembershipResignation } from "./selfServiceResignation";

setupTestDatabase();

let actor: TestActor;
let membership: Membership;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime("2030-08-07T10:00:00Z");
  vi.clearAllMocks();
  actor = createTestActor({ organizationId: newId(), role: "member" });
  membership = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: actor.organizationId,
    userId: actor._id,
    membershipNumber: "YFN-2030-TEST",
    isCurrent: true,
    legalStatus: "active",
    admittedAt: Date.parse("2030-01-01T11:00:00Z"),
    privateEmail: "alex@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    updatedAt: Date.now(),
  };
  actor.membershipId = membership._id;
  await Promise.all([
    (await memberships()).insertOne(membership),
    (await users()).insertOne(actor),
  ]);
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(membershipRequestMetadata).mockResolvedValue({
    ipAddress: "192.0.2.1",
    userAgent: "test-agent",
  });
  vi.mocked(sendGuardianResignationRequest).mockResolvedValue(true);
  vi.mocked(sendResignationConfirmation).mockResolvedValue(true);
});

afterEach(() => vi.useRealTimers());

test("records an adult member's own resignation and confirmation evidence", async () => {
  const receivedAt = parseBerlinDate("2030-08-07");
  const scheduledEndAt = resignationEndAt(receivedAt);

  await expect(requestOwnMembershipResignation()).resolves.toEqual({
    status: "received",
    scheduledEndAt,
    emailSent: true,
  });

  await expect(
    (await memberships()).findOne({ _id: membership._id }),
  ).resolves.toMatchObject({
    legalStatus: "resigning",
    resignationReceivedAt: receivedAt,
    scheduledEndAt,
    scheduledEndReason: "resignation",
  });
  await expect(
    (await membershipResignationRequests()).findOne({ _id: membership._id }),
  ).resolves.toMatchObject({
    status: "received",
    declarationText: RESIGNATION_DECLARATION_TEXT,
    requesterIpAddress: "192.0.2.1",
    confirmationEmailSentAt: Date.now(),
  });
  await expect(
    (await membershipEvents()).findOne({ membershipId: membership._id }),
  ).resolves.toMatchObject({
    actorUserId: actor._id,
    actorType: "user",
    details: { source: "member_portal" },
  });
  expect(sendResignationConfirmation).toHaveBeenCalledWith({
    member: membership,
    receivedAt,
    scheduledEndAt,
  });
});

test("requires a minor member's guardian to confirm via the one-time link", async () => {
  membership.dateOfBirth = "2013-01-01";
  membership.guardianConsent = {
    representativeName: "Robin Example",
    representativeEmail: "robin@example.org",
    signedAt: Date.now(),
    signatureStorageKey: "guardian/signature.png",
  };
  await (await memberships()).replaceOne({ _id: membership._id }, membership);

  await expect(requestOwnMembershipResignation()).resolves.toMatchObject({
    status: "pending_guardian",
    emailSent: true,
  });
  await expect(
    (await memberships()).findOne({ _id: membership._id }),
  ).resolves.toMatchObject({ legalStatus: "active" });
  const mailInput = vi.mocked(sendGuardianResignationRequest).mock.calls[0][0];
  const pending = await (
    await membershipResignationRequests()
  ).findOne({ _id: membership._id });
  expect(pending).toMatchObject({
    status: "pending_guardian",
    guardianEmail: "robin@example.org",
  });
  expect(pending?.guardianTokenHash).not.toBe(mailInput.token);

  await expect(
    confirmGuardianResignation(mailInput.token),
  ).resolves.toMatchObject({
    emailSent: true,
  });
  await expect(
    (await memberships()).findOne({ _id: membership._id }),
  ).resolves.toMatchObject({
    legalStatus: "resigning",
    scheduledEndReason: "resignation",
  });
  const received = await (
    await membershipResignationRequests()
  ).findOne({ _id: membership._id });
  expect(received).toMatchObject({
    status: "received",
    guardianConfirmedAt: Date.now(),
    guardianIpAddress: "192.0.2.1",
  });
  expect(received).not.toHaveProperty("guardianTokenHash");
  expect(sendResignationConfirmation).toHaveBeenCalledWith(
    expect.objectContaining({
      guardian: { name: "Robin Example", email: "robin@example.org" },
    }),
  );
});

test("rejects an expired guardian confirmation link", async () => {
  membership.dateOfBirth = "2013-01-01";
  membership.guardianConsent = {
    representativeName: "Robin Example",
    representativeEmail: "robin@example.org",
    signedAt: Date.now(),
    signatureStorageKey: "guardian/signature.png",
  };
  await (await memberships()).replaceOne({ _id: membership._id }, membership);
  await requestOwnMembershipResignation();
  const token = vi.mocked(sendGuardianResignationRequest).mock.calls[0][0]
    .token;

  vi.advanceTimersByTime(15 * 24 * 60 * 60 * 1_000);

  await expect(getGuardianResignationRequest(token)).resolves.toBeNull();
  await expect(confirmGuardianResignation(token)).rejects.toThrow(
    "ungültig oder abgelaufen",
  );
});
