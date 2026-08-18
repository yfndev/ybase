import type { MembershipGender } from "../db/types";

export const MEMBERSHIP_GENDERS = [
  "female",
  "male",
  "diverse",
] as const satisfies readonly MembershipGender[];

export const MEMBERSHIP_GENDER_LABELS = {
  female: "weiblich",
  male: "männlich",
  diverse: "divers",
} as const satisfies Record<MembershipGender, string>;
