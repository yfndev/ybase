import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));
vi.mock("../../googleWorkspace/users", () => ({
  provisionWorkspaceUser: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import {
  applications,
  jobPostings,
  logs,
  organizations,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { YFN_ORGANIZATION } from "../../organization";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { sendApplicationDecision } from "./decision";

const organizationId = newId();
const actorId = newId();
const postingId = newId();
const yfnEmail = `alex@${YFN_ORGANIZATION.domain}`;
let applicationId: string;
let postingTeamId: string;

setupTestDatabase();

afterEach(() => vi.unstubAllEnvs());

beforeEach(async () => {
  vi.clearAllMocks();
  applicationId = newId();
  postingTeamId = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ _id: actorId, organizationId }),
  );
  vi.mocked(sendMail).mockResolvedValue({
    status: "sent",
    messageId: "message-1",
  });
  vi.mocked(provisionWorkspaceUser).mockResolvedValue({
    userId: "google-user-1",
    primaryEmail: yfnEmail,
    temporaryPassword: "temporary-password",
  });
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.example");
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: YFN_ORGANIZATION.name,
    domain: YFN_ORGANIZATION.domain,
    createdBy: actorId,
  });
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: postingTeamId,
    status: "published",
    title: "Fundraising",
    createdBy: actorId,
  });
  const application: Application = {
    _id: applicationId,
    _creationTime: Date.now(),
    organizationId,
    jobPostingId: postingId,
    status: "review",
    applicantName: "Alex Beispiel",
    applicantEmail: "alex@example.com",
    applicantEmailNormalized: "alex@example.com",
    applicantPhone: "+49 170 1234567",
    fields: [],
    files: [],
    tallyEventId: newId(),
    tallySubmissionId: newId(),
    tallyResponseId: newId(),
    tallyFormId: "form-1",
    submittedAt: Date.now(),
  };
  await (await applications()).insertOne(application);
});

test("sends the edited acceptance email before changing the status", async () => {
  await sendApplicationDecision({
    applicationId,
    decision: "accepted",
    yfnEmail,
    subject: "Individuelle Zusage",
    message: "Wir freuen uns sehr auf dich.",
  });

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: "Individuelle Zusage",
      params: expect.objectContaining({
        message: expect.stringContaining("temporary-password"),
        jobTitle: "Fundraising",
        organizationName: YFN_ORGANIZATION.name,
      }),
    }),
  );
  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({
    status: "accepted",
    yfnEmail,
    workspaceUserId: "google-user-1",
    workspaceProvisioningStatus: "invited",
    onboardingUserId: expect.any(String),
  });
  expect(JSON.stringify(stored)).not.toContain("temporary-password");
  expect(stored?.history).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        fromStatus: "review",
        toStatus: "accepted",
      }),
    ]),
  );
  expect(
    await (await logs()).findOne({ entityId: applicationId }),
  ).toMatchObject({ action: "application.status_change" });
  expect(await (await users()).findOne({ applicationId })).toMatchObject({
    _id: stored?.onboardingUserId,
    name: "Alex Beispiel",
    email: yfnEmail,
    privateEmail: "alex@example.com",
    phone: "+49 170 1234567",
    googleWorkspaceUserId: "google-user-1",
    organizationId,
    role: "member",
    teamId: postingTeamId,
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });
});

test("sends a rejection with its dedicated template and then rejects", async () => {
  await (
    await applications()
  ).updateOne({ _id: applicationId }, { $set: { status: "received" } });

  await sendApplicationDecision({
    applicationId,
    decision: "rejected",
    subject: "Deine Bewerbung",
    message: "Vielen Dank für dein Interesse.",
  });

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: BREVO_TEMPLATE_IDS.APPLICATION_REJECTED,
      subject: "Deine Bewerbung",
    }),
  );
  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({ status: "rejected" });
});

test.each([
  { delivery: { status: "skipped", reason: "disabled" } as const },
  { delivery: new Error("Brevo unavailable") },
])("keeps the previous status when delivery fails", async ({ delivery }) => {
  if (delivery instanceof Error)
    vi.mocked(sendMail).mockRejectedValue(delivery);
  else vi.mocked(sendMail).mockResolvedValue(delivery);

  await expect(
    sendApplicationDecision({
      applicationId,
      decision: "accepted",
      yfnEmail,
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).rejects.toThrow();

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored?.status).toBe("review");
  expect(stored?.history).toBeUndefined();
  expect(stored?.workspaceProvisioningStatus).toBe("provisioned");
  expect(await (await users()).countDocuments({ applicationId })).toBe(0);
});

test("does not overwrite a withdrawal that happens during delivery", async () => {
  vi.mocked(sendMail).mockImplementationOnce(async () => {
    await (
      await applications()
    ).updateOne(
      { _id: applicationId },
      { $set: { status: "withdrawn", fields: [], files: [] } },
    );
    return { status: "sent", messageId: "message-2" };
  });

  await expect(
    sendApplicationDecision({
      applicationId,
      decision: "accepted",
      yfnEmail,
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).rejects.toThrow("zwischenzeitlich geändert");

  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({ status: "withdrawn", fields: [], files: [] });
  expect(await (await users()).countDocuments({ applicationId })).toBe(0);
});
