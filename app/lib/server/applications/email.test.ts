import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));

import {
  applications,
  jobPostings,
  organizations,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { sendApplicationEmails } from "./email";

setupTestDatabase();

let organizationId: string;
let postingId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv("BREVO_API_KEY", "secret");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.example");
  vi.mocked(sendMail).mockResolvedValue({ status: "sent" });

  organizationId = newId();
  postingId = newId();
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "example.org",
    createdBy: newId(),
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
    createdBy: newId(),
  });
  const application: Application = {
    _id: "application-1",
    _creationTime: Date.now(),
    organizationId,
    jobPostingId: postingId,
    status: "received",
    applicantName: "Alex",
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

afterEach(() => vi.unstubAllEnvs());

test("includes the secure withdrawal link in the receipt email", async () => {
  await sendApplicationEmails("application-1", "secure_token");

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: [{ email: "alex@example.com", name: "Alex" }],
      params: expect.objectContaining({
        withdrawalUrl:
          "https://ybase.example/withdraw-application/secure_token",
      }),
    }),
  );
});

test("tells recruiting who to contact without setting an email reply-to", async () => {
  const contactId = newId();
  await (
    await users()
  ).insertOne({
    _id: contactId,
    _creationTime: Date.now(),
    organizationId,
    name: "Recruiting",
    email: "recruiting@example.com",
    role: "people_culture",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  await (
    await jobPostings()
  ).updateOne({ _id: postingId }, { $set: { contactUserIds: [contactId] } });

  await sendApplicationEmails("application-1", "secure_token");

  const recruitingMessage = vi.mocked(sendMail).mock.calls[1]?.[0];
  expect(recruitingMessage).toMatchObject({
    to: [{ email: "recruiting@example.com", name: "Recruiting" }],
    params: expect.objectContaining({ applicantEmail: "alex@example.com" }),
  });
  expect(recruitingMessage).not.toHaveProperty("replyTo");
});
