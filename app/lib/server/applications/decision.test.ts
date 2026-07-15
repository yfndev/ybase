import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));

import { requirePermission } from "../../auth/session";
import {
  applications,
  jobPostings,
  logs,
  organizations,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { sendApplicationDecision } from "./decision";

const organizationId = newId();
const actorId = newId();
const postingId = newId();
let applicationId: string;

setupTestDatabase();

beforeEach(async () => {
  vi.clearAllMocks();
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
    domain: "example.org",
    createdBy: actorId,
  });
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
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
    subject: "Individuelle Zusage",
    message: "Wir freuen uns sehr auf dich.",
  });

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: "Individuelle Zusage",
      params: expect.objectContaining({
        message: "Wir freuen uns sehr auf dich.",
        jobTitle: "Fundraising",
      }),
    }),
  );
  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored?.status).toBe("accepted");
  expect(stored?.history?.at(-1)).toMatchObject({
    fromStatus: "review",
    toStatus: "accepted",
  });
  expect(
    await (await logs()).findOne({ entityId: applicationId }),
  ).toMatchObject({ action: "application.status_change" });
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
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).rejects.toThrow();

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored?.status).toBe("review");
  expect(stored?.history).toBeUndefined();
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
      subject: "Zusage",
      message: "Willkommen!",
    }),
  ).rejects.toThrow("zwischenzeitlich geändert");

  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({ status: "withdrawn", fields: [], files: [] });
});
