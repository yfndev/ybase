import {
  applications,
  jobPostings,
  organizations,
  users,
} from "../../db/collections";
import type { Application, JobPosting } from "../../db/types";
import { type EmailRecipient, sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { appUrl } from "../../email/urls";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function applicationUrl(jobPostingId: string): string | null {
  try {
    return appUrl(`/recruiting/${jobPostingId}`);
  } catch {
    return null;
  }
}

function withdrawalUrl(token: string): string {
  return appUrl(`/withdraw-application/${encodeURIComponent(token)}`);
}

async function sendApplicantEmail(
  application: Application,
  posting: JobPosting,
  organizationName: string,
  withdrawalToken: string,
): Promise<void> {
  try {
    await sendMail({
      to: [
        { email: application.applicantEmail, name: application.applicantName },
      ],
      templateId: BREVO_TEMPLATE_IDS.APPLICATION_RECEIVED_APPLICANT,
      params: {
        applicantName: application.applicantName ?? "",
        jobTitle: posting.title,
        organizationName,
        withdrawalUrl: withdrawalUrl(withdrawalToken),
      },
      tags: ["ybase", "application", "application-received"],
    });
  } catch (error) {
    console.error("application applicant email failed", error);
  }
}

async function sendContactEmail(
  application: Application,
  posting: JobPosting,
): Promise<void> {
  const selectedContacts = posting.contactUserIds?.length
    ? await (
        await users()
      )
        .find({
          _id: { $in: posting.contactUserIds },
          organizationId: posting.organizationId,
          memberStatus: { $ne: "offboarded" },
        })
        .project({ name: 1, email: 1 })
        .toArray()
    : [];
  const recipients: EmailRecipient[] = selectedContacts.flatMap((contact) => {
    const email = contact.email?.trim();
    return email && EMAIL_PATTERN.test(email)
      ? [{ email, name: contact.name }]
      : [];
  });
  if (recipients.length === 0) return;

  try {
    await sendMail({
      to: recipients,
      templateId: BREVO_TEMPLATE_IDS.APPLICATION_RECEIVED_RECRUITING_TEAM,
      params: {
        jobTitle: posting.title,
        applicantName: application.applicantName ?? application.applicantEmail,
        applicantEmail: application.applicantEmail,
        applicationUrl: applicationUrl(posting._id) ?? "",
      },
      tags: ["ybase", "application", "application-notify"],
    });
  } catch (error) {
    console.error("application notification email failed", error);
  }
}

export async function sendApplicationEmails(
  applicationId: string,
  withdrawalToken: string,
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return;

  const application = await (
    await applications()
  ).findOne({ _id: applicationId });
  if (!application) return;

  const posting = await (
    await jobPostings()
  ).findOne({ _id: application.jobPostingId });
  if (!posting) return;

  const organization = await (
    await organizations()
  ).findOne({ _id: application.organizationId });

  await sendApplicantEmail(
    application,
    posting,
    organization?.name ?? "",
    withdrawalToken,
  );
  await sendContactEmail(application, posting);
}
