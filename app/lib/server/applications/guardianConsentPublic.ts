import { applications } from "../../db/collections";
import { guardianConsentDirectory } from "../../s3/keys";
import { putObject } from "../../s3/storage";
import { membershipRequestMetadata } from "../memberships/requestMetadata";
import { decodeSignatureDataUrl } from "../memberships/signingPdf";
import { createApplicationHistoryEntry } from "./history";
import { createGuardianConsentPdf } from "./guardianConsentPdf";
import { hashGuardianConsentToken } from "./guardianConsentToken";

const SIGNING_TIMEOUT_MS = 10 * 60 * 1_000;
const OPEN_STATUSES = ["received", "review", "interview"] as const;

export type GuardianConsentValidation =
  | { valid: false; error: string }
  | { valid: true; applicantName: string; representativeName: string };

function tokenHash(token: string): string | null {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token)
    ? hashGuardianConsentToken(token)
    : null;
}

export async function validateGuardianConsentToken(
  token: string,
): Promise<GuardianConsentValidation> {
  const hash = tokenHash(token);
  if (!hash) return { valid: false, error: "Link ungültig" };
  const application = await (
    await applications()
  ).findOne({
    "guardianConsent.tokenHash": hash,
    status: { $in: OPEN_STATUSES },
  });
  if (!application?.guardianConsent) {
    return { valid: false, error: "Link ungültig" };
  }
  if (application.guardianConsent.signedAt) {
    return { valid: false, error: "Zustimmung bereits erteilt" };
  }
  if (application.guardianConsent.expiresAt <= Date.now()) {
    return { valid: false, error: "Link abgelaufen" };
  }
  return {
    valid: true,
    applicantName: application.applicantName ?? "das minderjährige Mitglied",
    representativeName: application.guardianConsent.representativeName,
  };
}

export async function completeGuardianConsent(
  token: string,
  signatureDataUrl: string,
): Promise<void> {
  const hash = tokenHash(token);
  if (!hash) throw new Error("Link ungültig");
  const signature = decodeSignatureDataUrl(signatureDataUrl);
  const collection = await applications();
  const application = await collection.findOne({
    "guardianConsent.tokenHash": hash,
    status: { $in: OPEN_STATUSES },
  });
  const consent = application?.guardianConsent;
  if (!application || !consent || !application.dateOfBirth) {
    throw new Error("Link ungültig");
  }
  const signedAt = Date.now();
  if (consent.signedAt) return;
  if (consent.expiresAt <= signedAt) throw new Error("Link abgelaufen");

  const reserved = await collection.updateOne(
    {
      _id: application._id,
      status: { $in: OPEN_STATUSES },
      "guardianConsent.tokenHash": hash,
      "guardianConsent.signedAt": { $exists: false },
      "guardianConsent.expiresAt": { $gt: signedAt },
      $or: [
        { "guardianConsent.signingStartedAt": { $exists: false } },
        {
          "guardianConsent.signingStartedAt": {
            $lte: signedAt - SIGNING_TIMEOUT_MS,
          },
        },
      ],
    },
    { $set: { "guardianConsent.signingStartedAt": signedAt } },
  );
  if (reserved.modifiedCount !== 1) {
    throw new Error("Zustimmung wird bereits verarbeitet");
  }

  const directory = guardianConsentDirectory(
    application.organizationId,
    application._id,
  );
  const signatureStorageKey = `${directory}/signature.png`;
  const completedPdfStorageKey = `${directory}/completed.pdf`;
  try {
    const completedPdf = await createGuardianConsentPdf({
      applicantName: application.applicantName ?? "Mitglied",
      applicationId: application._id,
      dateOfBirth: application.dateOfBirth,
      representativeName: consent.representativeName,
      signedAt,
      signaturePng: signature,
    });
    await Promise.all([
      putObject(signatureStorageKey, signature, "image/png"),
      putObject(completedPdfStorageKey, completedPdf, "application/pdf"),
    ]);
    const metadata = await membershipRequestMetadata();
    const entry = createApplicationHistoryEntry(
      "public-link",
      "guardian_consent_recorded",
      "Vertretungszustimmung erteilt",
    );
    const result = await collection.updateOne(
      {
        _id: application._id,
        status: { $in: OPEN_STATUSES },
        "guardianConsent.tokenHash": hash,
        "guardianConsent.signingStartedAt": signedAt,
      },
      {
        $set: {
          "guardianConsent.signedAt": signedAt,
          "guardianConsent.signatureStorageKey": signatureStorageKey,
          "guardianConsent.completedPdfStorageKey": completedPdfStorageKey,
          ...Object.fromEntries(
            Object.entries(metadata).map(([key, value]) => [
              `guardianConsent.${key}`,
              value,
            ]),
          ),
          updatedAt: signedAt,
        },
        $unset: { "guardianConsent.signingStartedAt": "" },
        $push: { history: entry },
      },
    );
    if (result.modifiedCount !== 1) throw new Error("Bewerbung wurde geändert");
  } catch (error) {
    await collection.updateOne(
      {
        _id: application._id,
        "guardianConsent.tokenHash": hash,
        "guardianConsent.signingStartedAt": signedAt,
      },
      { $unset: { "guardianConsent.signingStartedAt": "" } },
    );
    throw error;
  }
}
