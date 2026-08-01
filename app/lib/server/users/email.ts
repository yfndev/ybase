import type {
  MemberStatus,
  StoredMemberStatus,
  TeamOnboardingStatus,
  User,
} from "../../db/types";
import { type EmailRecipient, sendMail } from "../../email/brevo";
import {
  type UserStateEmailEvent,
  USER_STATE_EMAIL_TEMPLATES,
} from "../../email/templates";
import { appUrl } from "../../email/urls";
import { YFN_ORGANIZATION } from "../../organization";

type UserEmailProfile = Pick<User, "name" | "email" | "privateEmail">;

const MEMBER_STATUS_EMAIL_EVENTS: Record<MemberStatus, UserStateEmailEvent> = {
  onboarding: "member_onboarding_started",
  active: "member_activated",
  offboarding_planned: "member_offboarding_planned",
  offboarding: "member_offboarding_started",
  archived: "member_archived",
  excluded: "member_excluded",
};

const TEAM_ONBOARDING_EMAIL_EVENTS: Record<
  TeamOnboardingStatus,
  UserStateEmailEvent | undefined
> = {
  not_started: undefined,
  in_progress: "team_onboarding_started",
  completed: "team_onboarding_completed",
};

export async function notifyMemberStatusChange(input: {
  user: UserEmailProfile;
  previous: StoredMemberStatus;
  next: MemberStatus;
}): Promise<void> {
  if (input.previous === input.next) return;
  await sendUserStateEmail({
    user: input.user,
    event: MEMBER_STATUS_EMAIL_EVENTS[input.next],
  });
}

export async function notifyTeamOnboardingChange(input: {
  user: UserEmailProfile;
  previous: TeamOnboardingStatus;
  next: TeamOnboardingStatus;
}): Promise<void> {
  if (input.previous === input.next) return;
  const event = TEAM_ONBOARDING_EMAIL_EVENTS[input.next];
  if (!event) return;
  await sendUserStateEmail({ user: input.user, event });
}

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

export async function sendWorkspaceAccountReadyEmail(input: {
  recoveryEmail: string;
  applicantName?: string;
  workspaceEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}): Promise<void> {
  await sendConfiguredUserEmail(
    "workspace_account_ready",
    { email: input.recoveryEmail, name: input.applicantName },
    {
      memberName: input.applicantName ?? "",
      workspaceEmail: input.workspaceEmail,
      temporaryPassword: input.temporaryPassword,
      loginUrl: input.loginUrl,
    },
  );
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
