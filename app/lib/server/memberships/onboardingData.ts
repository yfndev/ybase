"use server";

import { documentExecutions, documentVersions } from "../../db/collections";
import type {
  DocumentExecution,
  DocumentExecutionType,
  DocumentVersion,
  MembershipDocumentKind,
  MembershipGender,
  PostalAddress,
  User,
} from "../../db/types";
import { documentOrderIndex } from "../../members/documents";
import { isGettingToKnowConfirmed } from "../../members/gettingToKnow";

export interface MembershipOnboardingDocument {
  executionId: string;
  kind: MembershipDocumentKind;
  title: string;
  versionLabel: string;
  type: DocumentExecutionType;
  status: DocumentExecution["status"];
  content: string;
}

export interface MembershipOnboardingProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: MembershipGender;
  privateEmail: string;
  phone: string;
  address: PostalAddress;
  applicationSigned: boolean;
}

export interface MembershipOnboardingContext {
  phase: "documents" | "membership";
  activated: boolean;
  documentsComplete: boolean;
  profile?: MembershipOnboardingProfile;
  documents: MembershipOnboardingDocument[];
}
import { loadDocumentContent } from "./documentContent";
import { assignOnboardingDocuments } from "./documentAssignments";
import {
  activateMembershipIfComplete,
  startGettingToKnowIfComplete,
} from "./onboardingCompletion";
import { requireOnboardingUser } from "./onboardingActor";
import { ensureMembershipForAdmission } from "./onboardingMembership";

export async function getOwnMembershipOnboardingContext(): Promise<
  { blocked: string } | MembershipOnboardingContext
> {
  const actor = await requireOnboardingUser(true);
  const isDocumentPhase =
    actor.memberStatus !== "active" && !isGettingToKnowConfirmed(actor);
  try {
    return isDocumentPhase
      ? await onboardingDocumentsContext(actor)
      : await membershipContext(actor);
  } catch (error) {
    return {
      blocked:
        error instanceof Error
          ? error.message
          : "Das Onboarding ist nicht verfügbar.",
    };
  }
}

async function onboardingDocumentsContext(
  actor: User & { organizationId: string },
): Promise<MembershipOnboardingContext> {
  if (actor.memberStatus === "onboarding") {
    await assignOnboardingDocuments(actor);
  }
  const documents = await loadDocuments(actor.organizationId, {
    userId: actor._id,
    membershipId: { $exists: false },
  });
  const activated = await startGettingToKnowIfComplete(actor);
  return {
    phase: "documents",
    activated,
    documentsComplete: documents.every(({ status }) => status === "completed"),
    documents,
  };
}

async function membershipContext(
  actor: User & { organizationId: string },
): Promise<MembershipOnboardingContext> {
  const membership = await ensureMembershipForAdmission(actor);
  const activated = await activateMembershipIfComplete(membership._id);
  const documents = await loadDocuments(actor.organizationId, {
    membershipId: membership._id,
    userId: actor._id,
  });
  return {
    phase: "membership",
    activated,
    documentsComplete: documents.every(({ status }) => status === "completed"),
    profile: {
      firstName: membership.firstName,
      lastName: membership.lastName,
      dateOfBirth: membership.dateOfBirth,
      gender: membership.gender,
      privateEmail: membership.privateEmail,
      phone: membership.phone ?? "",
      address: membership.address ?? {
        street: "",
        postalCode: "",
        city: "",
        country: "Deutschland",
      },
      applicationSigned: Boolean(membership.applicationSignature),
    },
    documents,
  };
}

async function loadDocuments(
  organizationId: string,
  scope: Record<string, unknown>,
): Promise<MembershipOnboardingDocument[]> {
  const executions = await (await documentExecutions())
    .find({ organizationId, ...scope, status: { $ne: "revoked" } })
    .toArray();
  const versions = await loadVersions(organizationId, executions);
  const ordered = executions.sort(
    (first, second) =>
      orderOf(versions.get(first.documentVersionId)) -
      orderOf(versions.get(second.documentVersionId)),
  );
  return Promise.all(
    ordered.map((execution) =>
      toDocumentTask(execution, versions.get(execution.documentVersionId)),
    ),
  );
}

async function loadVersions(
  organizationId: string,
  executions: DocumentExecution[],
): Promise<Map<string, DocumentVersion>> {
  if (executions.length === 0) return new Map();
  const versions = await (
    await documentVersions()
  )
    .find({
      organizationId,
      _id: {
        $in: executions.map(({ documentVersionId }) => documentVersionId),
      },
    })
    .toArray();
  return new Map(versions.map((version) => [version._id, version]));
}

async function toDocumentTask(
  execution: DocumentExecution,
  version?: DocumentVersion,
): Promise<MembershipOnboardingDocument> {
  if (!version) {
    throw new Error("Die eingefrorene Dokumentversion fehlt.");
  }
  return {
    executionId: execution._id,
    kind: version.kind,
    title: version.title,
    versionLabel: version.versionLabel,
    type: execution.executionType,
    status: execution.status,
    content: await loadDocumentContent(
      version.contentStorageKey,
      version.sha256,
    ),
  };
}

function orderOf(version?: DocumentVersion): number {
  return version ? documentOrderIndex(version.kind) : Number.MAX_SAFE_INTEGER;
}
