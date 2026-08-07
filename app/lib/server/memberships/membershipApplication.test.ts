import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireAuthenticatedUser: vi.fn() }));
vi.mock("../../s3/storage", () => ({
  getObjectBuffer: vi.fn(async () =>
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.alloc(120),
    ]),
  ),
  getObjectSize: vi.fn(async () => 128),
  putObject: vi.fn(),
}));
vi.mock("./requestMetadata", () => ({ membershipRequestMetadata: vi.fn() }));
vi.mock("./membershipApplicationPdf", () => ({
  createMembershipApplicationPdf: vi.fn(),
}));

import { requireAuthenticatedUser } from "../../auth/session";
import {
  applications,
  documentExecutions,
  documentVersions,
  memberships,
  teams,
  uploadOwnerships,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application, User } from "../../db/types";
import { putObject } from "../../s3/storage";
import { insertTestOrganization } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { submitOwnMembershipApplication } from "./membershipApplication";
import { createMembershipApplicationPdf } from "./membershipApplicationPdf";
import { ensureAcceptedApplicantMembership } from "./onboardingMembership";
import { membershipRequestMetadata } from "./requestMetadata";
import { registerPendingUpload } from "../uploads/ownership";

setupTestDatabase();

const SIGNATURE_STORAGE_KEY = "membership-signature-key";

const FORM = {
  privateEmail: "Alex.Private@Example.org",
  phone: "+49 30 654321",
  gender: "diverse",
  street: "Beispielstraße 12",
  postalCode: "10115",
  city: "Berlin",
  country: "Deutschland",
  signatureStorageKey: SIGNATURE_STORAGE_KEY,
} as const;

let actor: User & { organizationId: string };
let membershipId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  const now = Date.now();
  const organization = await insertTestOrganization({
    name: "Young Founders Network e.V.",
    careOf: "CODE Education GmbH",
  });
  const teamId = newId();
  const departmentId = newId();
  const applicationId = newId();
  actor = {
    _id: newId(),
    _creationTime: now,
    organizationId: organization._id,
    applicationId,
    memberPlatformUserId: "member-platform-profile",
    name: "Alex Beispiel",
    email: "alex@youngfounders.network",
    teamId,
    role: "member",
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
  };
  const application: Application = {
    _id: applicationId,
    _creationTime: now,
    organizationId: organization._id,
    jobPostingId: newId(),
    status: "accepted",
    applicantName: "Alex Beispiel",
    applicantEmail: "alex@example.org",
    applicantEmailNormalized: "alex@example.org",
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: actor.memberPlatformUserId,
    fields: [],
    files: [],
    tallyEventId: newId(),
    tallySubmissionId: newId(),
    tallyResponseId: newId(),
    tallyFormId: "form-1",
    submittedAt: now,
    onboardingStartedAt: now,
  };
  await Promise.all([
    (await users()).insertOne(actor),
    (await applications()).insertOne(application),
    (await teams()).insertOne({
      _id: teamId,
      _creationTime: now,
      organizationId: organization._id,
      departmentId,
      name: "Operations",
      isArchived: false,
      createdBy: actor._id,
    }),
  ]);
  await Promise.all([
    seedVersion("privacy_notice", "acknowledgement", []),
    seedVersion("bylaws", "acknowledgement", []),
    seedVersion("usage_rights", "signature", [departmentId]),
  ]);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
  vi.mocked(membershipRequestMetadata).mockResolvedValue({
    ipAddress: "192.0.2.1",
    userAgent: "test",
  });
  vi.mocked(createMembershipApplicationPdf).mockResolvedValue(
    new Uint8Array([1, 2, 3]),
  );
  membershipId = (await ensureAcceptedApplicantMembership(actor))._id;
  await registerPendingUpload(SIGNATURE_STORAGE_KEY, {
    organizationId: actor.organizationId,
    userId: actor._id,
    contextType: "user",
    contextId: actor._id,
  });
});

test("blocks the membership form until every document is completed", async () => {
  await expect(submitOwnMembershipApplication(FORM)).rejects.toThrow(
    "zuerst alle Unterlagen",
  );

  expect(putObject).not.toHaveBeenCalled();
  expect(
    await (await memberships()).findOne({ _id: membershipId }),
  ).not.toHaveProperty("applicationSignature");
});

test("stores the signed application and activates the account", async () => {
  await completeAllDocuments();

  expect(await submitOwnMembershipApplication(FORM)).toEqual({
    activated: true,
  });

  const directory = `memberships/${actor.organizationId}/applications/${membershipId}/membership-form`;
  expect(putObject).toHaveBeenCalledWith(
    `${directory}/membership-application.pdf`,
    expect.anything(),
    "application/pdf",
  );
  expect(
    await (await memberships()).findOne({ _id: membershipId }),
  ).toMatchObject({
    gender: "diverse",
    phone: "+49 30 654321",
    privateEmail: "alex.private@example.org",
    address: { street: "Beispielstraße 12", city: "Berlin" },
    admissionEvidenceStorageKey: `${directory}/membership-application.pdf`,
    applicationSignature: {
      ipAddress: "192.0.2.1",
      signatureStorageKey: SIGNATURE_STORAGE_KEY,
    },
  });
  expect(await (await users()).findOne({ _id: actor._id })).toMatchObject({
    memberStatus: "active",
    privateEmail: "alex.private@example.org",
  });
  expect(
    await (await uploadOwnerships()).findOne({ _id: SIGNATURE_STORAGE_KEY }),
  ).toMatchObject({
    claimedByType: "membershipApplication",
    claimedById: membershipId,
  });
});

test("activates a manually added member without an application record", async () => {
  delete actor.applicationId;
  await Promise.all([
    (await users()).updateOne(
      { _id: actor._id },
      { $unset: { applicationId: "" } },
    ),
    (await memberships()).updateOne(
      { _id: membershipId },
      { $unset: { applicationId: "" } },
    ),
    (await applications()).deleteMany({ organizationId: actor.organizationId }),
  ]);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
  await completeAllDocuments();

  await expect(submitOwnMembershipApplication(FORM)).resolves.toEqual({
    activated: true,
  });
  await expect(
    (await users()).findOne({ _id: actor._id }),
  ).resolves.toMatchObject({ memberStatus: "active" });
});

test("rejects a submission without a usable signature", async () => {
  await completeAllDocuments();

  await expect(
    submitOwnMembershipApplication({ ...FORM, signatureStorageKey: "" }),
  ).rejects.toThrow();

  expect(putObject).not.toHaveBeenCalled();
  expect(await (await users()).findOne({ _id: actor._id })).toMatchObject({
    memberStatus: "onboarding",
  });
});

async function completeAllDocuments() {
  await (
    await documentExecutions()
  ).updateMany(
    { membershipId },
    { $set: { status: "completed", completedAt: Date.now() } },
  );
}

async function seedVersion(
  kind: "privacy_notice" | "bylaws" | "usage_rights",
  executionType: "acknowledgement" | "signature",
  targetDepartmentIds: string[],
) {
  const id = newId();
  await (
    await documentVersions()
  ).insertOne({
    _id: id,
    _creationTime: Date.now(),
    organizationId: actor.organizationId,
    kind,
    title: kind,
    versionLabel: "2026-01",
    contentStorageKey: `test/${id}/content.html`,
    sha256: id.padEnd(64, "0").slice(0, 64),
    publishedAt: Date.now(),
    publishedBy: actor._id,
    targetTeamIds: [],
    targetDepartmentIds,
    executionType,
    isActive: true,
  });
}
