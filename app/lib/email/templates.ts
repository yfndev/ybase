export const BREVO_TEMPLATE_IDS = {
  SUBMISSION_REQUESTED: 141,
  SUBMISSION_RECEIVED: 142,
  CHANGES_REQUESTED: 143,
  SUBMISSION_APPROVED: 144,
  SUBMISSION_REJECTED: 145,
  APPLICATION_RECEIVED_APPLICANT: 149,
  APPLICATION_RECEIVED_RECRUITING_TEAM: 150,
  APPLICATION_ACCEPTED: 151,
  APPLICATION_REJECTED: 152,

  TEAM_ONBOARDING_STARTED: 171,
  WORKSPACE_ACCOUNT_READY: 172,
} as const;

export type UserStateEmailEvent =
  | "team_onboarding_started"
  | "workspace_account_ready";

export const USER_STATE_EMAIL_TEMPLATES = {
  team_onboarding_started: {
    templateId: BREVO_TEMPLATE_IDS.TEAM_ONBOARDING_STARTED,
    tag: "team-onboarding-started",
  },
  workspace_account_ready: {
    templateId: BREVO_TEMPLATE_IDS.WORKSPACE_ACCOUNT_READY,
    tag: "workspace-account-ready",
  },
} as const satisfies Record<
  UserStateEmailEvent,
  { templateId: number | undefined; tag: string }
>;
