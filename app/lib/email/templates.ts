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
  MEMBERSHIP_GUARDIAN_CONSENT: 153,

  MEMBER_ONBOARDING_STARTED: undefined,
  MEMBER_ACTIVATED: undefined,
  TEAM_ONBOARDING_STARTED: undefined,
  TEAM_ONBOARDING_COMPLETED: undefined,
  MEMBER_OFFBOARDING_PLANNED: undefined,
  MEMBER_OFFBOARDING_STARTED: undefined,
  MEMBER_ARCHIVED: undefined,
  MEMBER_EXCLUDED: undefined,
  WORKSPACE_ACCOUNT_READY: undefined,
} as const;

export type UserStateEmailEvent =
  | "member_onboarding_started"
  | "member_activated"
  | "team_onboarding_started"
  | "team_onboarding_completed"
  | "member_offboarding_planned"
  | "member_offboarding_started"
  | "member_archived"
  | "member_excluded"
  | "workspace_account_ready";

export const USER_STATE_EMAIL_TEMPLATES = {
  member_onboarding_started: {
    templateId: BREVO_TEMPLATE_IDS.MEMBER_ONBOARDING_STARTED,
    tag: "member-onboarding-started",
  },
  member_activated: {
    templateId: BREVO_TEMPLATE_IDS.MEMBER_ACTIVATED,
    tag: "member-activated",
  },
  team_onboarding_started: {
    templateId: BREVO_TEMPLATE_IDS.TEAM_ONBOARDING_STARTED,
    tag: "team-onboarding-started",
  },
  team_onboarding_completed: {
    templateId: BREVO_TEMPLATE_IDS.TEAM_ONBOARDING_COMPLETED,
    tag: "team-onboarding-completed",
  },
  member_offboarding_planned: {
    templateId: BREVO_TEMPLATE_IDS.MEMBER_OFFBOARDING_PLANNED,
    tag: "member-offboarding-planned",
  },
  member_offboarding_started: {
    templateId: BREVO_TEMPLATE_IDS.MEMBER_OFFBOARDING_STARTED,
    tag: "member-offboarding-started",
  },
  member_archived: {
    templateId: BREVO_TEMPLATE_IDS.MEMBER_ARCHIVED,
    tag: "member-archived",
  },
  member_excluded: {
    templateId: BREVO_TEMPLATE_IDS.MEMBER_EXCLUDED,
    tag: "member-excluded",
  },
  workspace_account_ready: {
    templateId: BREVO_TEMPLATE_IDS.WORKSPACE_ACCOUNT_READY,
    tag: "workspace-account-ready",
  },
} as const satisfies Record<
  UserStateEmailEvent,
  { templateId: number | undefined; tag: string }
>;
