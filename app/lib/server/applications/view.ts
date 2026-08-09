import type { Application, ApplicationWithFiles } from "../../db/types";

export function toApplicationView(
  application: Application,
  jobPostingTitle: string,
): ApplicationWithFiles {
  const {
    applicantEmailNormalized: _applicantEmailNormalized,
    files,
    tallyEventId: _tallyEventId,
    tallySubmissionId: _tallySubmissionId,
    tallyResponseId: _tallyResponseId,
    tallyFormId: _tallyFormId,
    withdrawalTokenHash: _withdrawalTokenHash,
    yfnEmailNormalized: _yfnEmailNormalized,
    workspaceUserId: _workspaceUserId,
    admissionDecision: _admissionDecision,
    rejectionDelivery: _rejectionDelivery,
    appealTokenHash: _appealTokenHash,
    appealExpiresAt: _appealExpiresAt,
    appealedAt: _appealedAt,
    appealStatement: _appealStatement,
    appealDecision: _appealDecision,
    onboardingStartedBy: _onboardingStartedBy,
    onboardingCompletedBy: _onboardingCompletedBy,
    cleanupEligibleAt: _cleanupEligibleAt,
    ownerIds,
    ...visibleApplication
  } = application;
  return {
    ...visibleApplication,
    jobPostingTitle,
    ownerIds: ownerIds ?? [],
    files: files.map(
      ({ sourceUrl: _sourceUrl, storageKey: _storageKey, ...file }) => file,
    ),
  };
}
