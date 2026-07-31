import type { UpdateFilter } from "mongodb";
import { applications } from "../../db/collections";
import type { Application, GuardianConsent } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { appUrl } from "../../email/urls";
import { YFN_ORGANIZATION } from "../../organization";
import { createGuardianConsentToken } from "./guardianConsentToken";

const CONSENT_VALIDITY_MS = 7 * 24 * 60 * 60 * 1_000;

export async function deliverGuardianConsentRequest(input: {
  application: Application;
  representativeName: string;
  representativeEmail: string;
  requestedAt: number;
}): Promise<string> {
  const { token, tokenHash } = createGuardianConsentToken();
  const consent: GuardianConsent = {
    representativeName: input.representativeName,
    representativeEmail: input.representativeEmail.toLowerCase(),
    tokenHash,
    expiresAt: input.requestedAt + CONSENT_VALIDITY_MS,
    lastSentAt: input.requestedAt,
  };
  await reserveGuardianRequest(input.application, consent, input.requestedAt);
  try {
    const delivery = await sendMail({
      to: [
        {
          email: consent.representativeEmail,
          name: consent.representativeName,
        },
      ],
      templateId: BREVO_TEMPLATE_IDS.MEMBERSHIP_GUARDIAN_CONSENT,
      params: {
        representativeName: consent.representativeName,
        applicantName:
          input.application.applicantName ?? "das minderjährige Mitglied",
        organizationName: YFN_ORGANIZATION.name,
        consentUrl: appUrl(`/guardian-consent/${encodeURIComponent(token)}`),
      },
      tags: ["ybase", "membership", "guardian-consent"],
    });
    if (delivery.status !== "sent") {
      throw new Error("E-Mail konnte nicht versendet werden");
    }
  } catch (error) {
    await rollbackGuardianRequest(input.application, tokenHash);
    throw error;
  }
  return tokenHash;
}

async function reserveGuardianRequest(
  application: Application,
  consent: GuardianConsent,
  now: number,
): Promise<void> {
  const previous = application.guardianConsent;
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: application.organizationId,
      status: application.status,
      memberPlatformUserId: application.memberPlatformUserId,
      dateOfBirth: application.dateOfBirth,
      ...(previous
        ? { "guardianConsent.tokenHash": previous.tokenHash }
        : { guardianConsent: { $exists: false } }),
    },
    { $set: { guardianConsent: consent, updatedAt: now } },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
}

async function rollbackGuardianRequest(
  application: Application,
  tokenHash: string,
): Promise<void> {
  let restore: UpdateFilter<Application>;
  if (application.guardianConsent) {
    restore = {
      $set: { guardianConsent: application.guardianConsent },
    };
  } else {
    restore = { $unset: { guardianConsent: "" } };
  }
  await (
    await applications()
  ).updateOne(
    { _id: application._id, "guardianConsent.tokenHash": tokenHash },
    restore,
  );
}
