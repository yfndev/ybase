"use client";

import { useMemo } from "react";
import { ApplicationActionFooter } from "@/components/Applications/ApplicationActionFooter";
import { ApplicationAdmissionRequirements } from "@/components/Applications/ApplicationAdmissionRequirements";
import { ApplicationAnswers } from "@/components/Applications/ApplicationAnswers";
import { ApplicationDetails } from "@/components/Applications/ApplicationDetails";
import { ApplicationFiles } from "@/components/Applications/ApplicationFiles";
import { ApplicationHistory } from "@/components/Applications/ApplicationHistory";
import { ApplicationReviewSidebar } from "@/components/Applications/ApplicationReviewSidebar";
import { isApplicantIdentityField } from "@/components/Applications/applicationPresentation";
import { PageHeader } from "@/components/Layout/PageHeader";
import { getApplicationAdmissionIssue } from "@/lib/applications/admissionEligibility";
import { useApplication } from "@/lib/client/applications/hooks/useApplication";
import type { ApplicationWithFiles, User } from "@/lib/db/types";

export function ApplicationReview({
  initialApplication,
  members,
  organizationDomain,
  backUrl,
}: {
  initialApplication: ApplicationWithFiles;
  members: User[];
  organizationDomain: string;
  backUrl: string;
}) {
  const { application, refetch } = useApplication(
    initialApplication._id,
    initialApplication,
  );
  const ownersById = useMemo(
    () => new Map(members.map((member) => [member._id, member])),
    [members],
  );
  const answerFields = application.fields.filter(
    (field) =>
      !isApplicantIdentityField(field) &&
      field.type.toUpperCase() !== "FILE_UPLOAD",
  );
  const withdrawn = application.status === "withdrawn";
  const displayName = withdrawn
    ? "Anonymisierte Bewerbung"
    : application.applicantName || "Bewerbung";
  const revisionKey = `${application._id}-${application.updatedAt ?? 0}-${application.status}`;

  return (
    <div className="w-full space-y-6">
      <PageHeader title={displayName} showBackButton backUrl={backUrl} />

      <main
        className="min-w-0 space-y-8 min-[1280px]:h-[calc(100svh-11.75rem)] min-[1280px]:overflow-y-auto min-[1280px]:overscroll-contain min-[1280px]:pr-4 min-[1280px]:[scrollbar-gutter:stable] [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-0"
        aria-label="Bewerbungsinformationen"
      >
        <div className="min-[1280px]:hidden [&>section]:border-t-0 [&>section]:pt-0">
          <ApplicationDetails application={application} />
        </div>
        <ApplicationAnswers title="Antworten" fields={answerFields} />
        <ApplicationFiles files={application.files} onFilesChanged={refetch} />
      </main>

      <ApplicationReviewSidebar
        footer={
          <ApplicationActionFooter
            applicationId={application._id}
            status={application.status}
            applicantName={application.applicantName}
            jobPostingTitle={application.jobPostingTitle}
            organizationDomain={organizationDomain}
            yfnEmail={application.yfnEmail}
            acceptanceBlockedReason={getApplicationAdmissionIssue(
              application,
              Date.now(),
            )}
          />
        }
      >
        <div className="hidden min-[1280px]:block">
          <ApplicationDetails application={application} />
        </div>
        {!withdrawn ? (
          <div>
            <ApplicationAdmissionRequirements
              key={`admission-${revisionKey}`}
              application={application}
            />
          </div>
        ) : null}
        <div>
          <ApplicationHistory
            application={application}
            ownersById={ownersById}
          />
        </div>
      </ApplicationReviewSidebar>
    </div>
  );
}
