import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));
vi.mock("../../googleWorkspace/users", () => ({
  provisionWorkspaceUser: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import { applications, jobPostings, organizations } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { sendApplicationDecision } from "./decision";
import { submitApplicationDecision } from "./decisionAction";
import { reserveWorkspaceProvisioning } from "./workspaceProvisioning";

setupTestDatabase();

const organizationId = "workspace-org";
const actorId = "workspace-actor";
let applicationId: string;

afterEach(() => vi.unstubAllEnvs());

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.example");
  applicationId = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ _id: actorId, organizationId }),
  );
  vi.mocked(sendMail).mockResolvedValue({
    status: "sent",
    messageId: "message-1",
  });
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "youngfounders.network",
    createdBy: actorId,
  });
  const postingId = newId();
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    status: "published",
    title: "People",
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
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: "platform-alex",
    memberPlatformSyncedAt: Date.now(),
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

test("records failed provisioning without sending an acceptance", async () => {
  vi.mocked(provisionWorkspaceUser).mockRejectedValueOnce(
    new Error("Workspace nicht verfügbar"),
  );

  await expect(
    sendApplicationDecision({
      applicationId,
      decision: "accepted",
      yfnEmail: "alex@youngfounders.network",
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).rejects.toThrow("Workspace nicht verfügbar");

  expect(sendMail).not.toHaveBeenCalled();
  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({
    status: "review",
    yfnEmail: "alex@youngfounders.network",
    workspaceProvisioningStatus: "failed",
    workspaceProvisioningError: "Workspace nicht verfügbar",
  });
});

test("allows only one active provisioning reservation", async () => {
  const application = await (
    await applications()
  ).findOne({ _id: applicationId });
  if (!application) throw new Error("Missing test application");
  const input = {
    application,
    organizationDomain: "youngfounders.network",
    yfnEmail: "alex@youngfounders.network",
  };

  await reserveWorkspaceProvisioning(input);
  await expect(reserveWorkspaceProvisioning(input)).rejects.toThrow(
    "bereits eingerichtet",
  );
});

test("validates the YBase URL before creating an account", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

  await expect(
    sendApplicationDecision({
      applicationId,
      decision: "accepted",
      yfnEmail: "alex@youngfounders.network",
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).rejects.toThrow("YBase-URL");
  expect(provisionWorkspaceUser).not.toHaveBeenCalled();
});

test("returns expected failures without a masked server action error", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

  await expect(
    submitApplicationDecision({
      applicationId,
      decision: "accepted",
      yfnEmail: "alex@youngfounders.network",
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).resolves.toEqual({
    ok: false,
    error: "YBase-URL ist nicht konfiguriert",
  });
});
