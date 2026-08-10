import type { User } from "../../db/types";
import { type EmailRecipient, sendMail } from "../../email/brevo";
import {
  BREVO_TEMPLATE_IDS,
  USER_STATE_EMAIL_TEMPLATES,
  type UserStateEmailEvent,
} from "../../email/templates";
import { appUrl } from "../../email/urls";
import { YFN_ORGANIZATION } from "../../organization";

type UserEmailProfile = Pick<User, "name" | "email" | "privateEmail">;

export async function sendUserStateEmail(input: {
  user: UserEmailProfile;
  event: UserStateEmailEvent;
}): Promise<void> {
  const recipient = userRecipient(input.user);
  if (!recipient) return;

  await sendConfiguredUserEmail(input.event, recipient, {
    memberName: input.user.name ?? "",
    memberEmail: input.user.email ?? "",
    privateEmail: input.user.privateEmail ?? "",
  });
}

const BERLIN_DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export async function sendGettingToKnowDueEmail(input: {
  recipient: UserEmailProfile;
  member: UserEmailProfile;
  endsAt: number;
}): Promise<void> {
  const recipient = userRecipient(input.recipient);
  if (!recipient) return;

  await sendConfiguredUserEmail("getting_to_know_due", recipient, {
    memberName: input.member.name ?? "",
    memberEmail: input.member.email ?? "",
    endsOn: BERLIN_DATE_FORMAT.format(input.endsAt),
  });
}

export async function sendTeamWelcomeEmail(input: {
  recoveryEmail: string;
  memberName?: string;
  workspaceEmail: string;
  temporaryPassword: string;
}): Promise<void> {
  const templateId = requireTeamWelcomeTemplateId();

  const delivery = await sendMail({
    to: [{ email: input.recoveryEmail, name: input.memberName }],
    templateId,
    params: {
      organizationName: YFN_ORGANIZATION.name,
      memberName: input.memberName ?? "",
      workspaceEmail: input.workspaceEmail,
      temporaryPassword: input.temporaryPassword,
    },
    tags: ["ybase", "user-state", "team-welcome"],
  });
  if (delivery.status !== "sent") {
    throw new Error("Team-Zugang konnte nicht versendet werden");
  }
}

export function requireTeamWelcomeTemplateId(): number {
  const templateId = BREVO_TEMPLATE_IDS.TEAM_WELCOME;
  if (!templateId) {
    throw new Error(
      "Brevo-Template für den Team-Zugang ist nicht konfiguriert",
    );
  }
  return templateId;
}

async function sendConfiguredUserEmail(
  event: UserStateEmailEvent,
  recipient: EmailRecipient,
  params: Record<string, string>,
): Promise<void> {
  const template = USER_STATE_EMAIL_TEMPLATES[event];
  const templateId = template.templateId;
  if (!templateId) return;

  try {
    const delivery = await sendMail({
      to: [recipient],
      templateId,
      params: {
        organizationName: YFN_ORGANIZATION.name,
        ybaseUrl: safeAppUrl("/"),
        ...params,
      },
      tags: ["ybase", "user-state", template.tag],
    });
    if (delivery.status === "skipped" && delivery.reason !== "disabled") {
      console.warn(`User-state email ${event} was skipped`, delivery.reason);
    }
  } catch (error) {
    console.error(`Could not send user-state email ${event}`, error);
  }
}

function userRecipient(user: UserEmailProfile): EmailRecipient | null {
  const email = user.privateEmail?.trim() || user.email?.trim();
  return email ? { email, name: user.name } : null;
}

function safeAppUrl(path: string): string {
  try {
    return appUrl(path);
  } catch {
    return "";
  }
}
