export const BREVO_TEMPLATE_IDS = {
  SUBMISSION_REQUESTED: 141,
  SUBMISSION_RECEIVED: 142,
  CHANGES_REQUESTED: 143,
  SUBMISSION_APPROVED: 144,
  SUBMISSION_REJECTED: 145,
  APPLICATION_RECEIVED_APPLICANT: 149,
  APPLICATION_RECEIVED_RECRUITING_TEAM: 150,
  APPLICATION_REJECTED: 152,

  TEAM_WELCOME: 175,

  GETTING_TO_KNOW_STARTED: undefined,
  GETTING_TO_KNOW_DUE: undefined,
  GETTING_TO_KNOW_ENDED: undefined,
  MEMBERSHIP_INVITATION: 176,
} as const;

export type UserStateEmailEvent =
  | "getting_to_know_started"
  | "getting_to_know_due"
  | "getting_to_know_ended"
  | "membership_invitation";

export const USER_STATE_EMAIL_TEMPLATES = {
  getting_to_know_started: {
    templateId: BREVO_TEMPLATE_IDS.GETTING_TO_KNOW_STARTED,
    tag: "getting-to-know-started",
  },
  getting_to_know_due: {
    templateId: BREVO_TEMPLATE_IDS.GETTING_TO_KNOW_DUE,
    tag: "getting-to-know-due",
  },
  getting_to_know_ended: {
    templateId: BREVO_TEMPLATE_IDS.GETTING_TO_KNOW_ENDED,
    tag: "getting-to-know-ended",
  },
  membership_invitation: {
    templateId: BREVO_TEMPLATE_IDS.MEMBERSHIP_INVITATION,
    tag: "membership-invitation",
  },
} as const satisfies Record<
  UserStateEmailEvent,
  { templateId: number | undefined; tag: string }
>;
