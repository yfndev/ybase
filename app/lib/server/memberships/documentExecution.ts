"use server";

import { z } from "zod";
import { requireAuthenticatedUser } from "../../auth/session";
import {
  documentExecutions,
  documentVersions,
  memberships,
} from "../../db/collections";
import type { DocumentExecution, DocumentVersion } from "../../db/types";
import { isUnavailableMemberStatus } from "../../members/status";
import { membershipExecutionDirectory } from "../../s3/keys";
import { putObject } from "../../s3/storage";
import { loadDocumentContent } from "./documentContent";
import { appendMembershipEvent } from "./events";
import { loadAndClaimMembershipSignature } from "./membershipSignatures";
import { activateMembershipOnboardingIfComplete } from "./onboardingCompletion";
import { membershipRequestMetadata } from "./requestMetadata";
import { createExecutionPdf } from "./signingPdf";

const completionSchema = z.object({
  executionId: z.string().min(1),
  signatureStorageKey: z.string().min(1).optional(),
  consentGranted: z.boolean().optional(),
});

export async function completeOwnDocument(
  input: z.input<typeof completionSchema>,
): Promise<void> {
  const parsed = completionSchema.parse(input);
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) throw new Error("User has no organization");
  if (isUnavailableMemberStatus(actor.memberStatus)) {
    throw new Error("User is unavailable");
  }
  const membership = await (
    await memberships()
  ).findOne({
    organizationId: actor.organizationId,
    userId: actor._id,
    isCurrent: true,
    legalStatus: { $in: ["active", "resigning"] },
  });
  if (!membership) throw new Error("Aktive Mitgliedschaft nicht gefunden.");

  const executions = await documentExecutions();
  const execution = await executions.findOne({
    _id: parsed.executionId,
    organizationId: actor.organizationId,
    membershipId: membership._id,
    userId: actor._id,
  });
  if (!execution || execution.status === "revoked") {
    throw new Error("Diese Unterlage wurde nicht gefunden.");
  }
  const version = await (
    await documentVersions()
  ).findOne({
    _id: execution.documentVersionId,
    organizationId: actor.organizationId,
    sha256: execution.documentHash,
  });
  if (!version || execution.executionType !== version.executionType) {
    throw new Error("Die eingefrorene Dokumentversion fehlt.");
  }
  if (execution.status === "completed") {
    await recordCompletionEvent(execution, version);
    await activateMembershipOnboardingIfComplete(membership._id);
    return;
  }

  const signatureStorageKey =
    execution.executionType === "signature"
      ? z.string().min(1).parse(parsed.signatureStorageKey)
      : undefined;
  const signature = signatureStorageKey
    ? await loadAndClaimMembershipSignature(
        signatureStorageKey,
        { _id: actor._id, organizationId: actor.organizationId },
        { type: "membershipDocument", id: execution._id },
      )
    : undefined;
  if (
    execution.executionType === "optional_consent" &&
    parsed.consentGranted === undefined
  ) {
    throw new Error("Bitte triff eine freiwillige Auswahl.");
  }
  if (
    execution.executionType !== "optional_consent" &&
    parsed.consentGranted !== undefined
  ) {
    throw new Error("Dieses Dokument enthält keine freiwillige Einwilligung.");
  }
  const completedAt = Date.now();
  const reservation = await executions.updateOne(
    {
      _id: execution._id,
      status: "assigned",
      $or: [
        { processingStartedAt: { $exists: false } },
        { processingStartedAt: { $lte: completedAt - 10 * 60 * 1_000 } },
      ],
    },
    { $set: { processingStartedAt: completedAt } },
  );
  if (reservation.modifiedCount !== 1) {
    throw new Error("Diese Unterlage wird bereits verarbeitet.");
  }

  try {
    const contentHtml = await loadDocumentContent(
      version.contentStorageKey,
      version.sha256,
    );
    const completedPdf = await createExecutionPdf({
      contentHtml,
      signaturePng: signature,
      title: version.title,
      versionLabel: version.versionLabel,
      documentHash: version.sha256,
      membershipId: membership._id,
      userId: actor._id,
      completedAt,
      consentGranted: parsed.consentGranted,
    });
    const directory = membershipExecutionDirectory(
      actor.organizationId,
      execution._id,
    );
    const completedPdfStorageKey = `${directory}/completed.pdf`;
    await putObject(completedPdfStorageKey, completedPdf, "application/pdf");
    const requestMetadata = await membershipRequestMetadata();
    const result = await executions.updateOne(
      {
        _id: execution._id,
        status: "assigned",
        processingStartedAt: completedAt,
      },
      {
        $set: {
          status: "completed",
          completedAt,
          ...(signature ? { signatureStorageKey } : {}),
          completedPdfStorageKey,
          ...(parsed.consentGranted !== undefined
            ? { consentGranted: parsed.consentGranted }
            : {}),
          ...requestMetadata,
        },
        $unset: { processingStartedAt: "" },
      },
    );
    if (result.modifiedCount !== 1) {
      throw new Error("Diese Unterlage wurde parallel geändert.");
    }
  } catch (error) {
    await executions.updateOne(
      {
        _id: execution._id,
        status: "assigned",
        processingStartedAt: completedAt,
      },
      { $unset: { processingStartedAt: "" } },
    );
    throw error;
  }

  await recordCompletionEvent(
    { ...execution, status: "completed", completedAt },
    version,
  );
  await activateMembershipOnboardingIfComplete(membership._id);
}

async function recordCompletionEvent(
  execution: DocumentExecution,
  version: DocumentVersion,
): Promise<void> {
  await appendMembershipEvent({
    organizationId: execution.organizationId,
    membershipId: execution.membershipId,
    userId: execution.userId,
    actorUserId: execution.userId,
    actorType: "user",
    type: "document.completed",
    idempotencyKey: `document-execution:${execution._id}:completed`,
    occurredAt: execution.completedAt ?? execution.assignedAt,
    details: { documentVersionId: version._id, sha256: version.sha256 },
  });
}
