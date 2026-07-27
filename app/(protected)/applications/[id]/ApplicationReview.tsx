"use client";

import { useMemo } from "react";
import { ApplicationActionFooter } from "@/components/Applications/ApplicationActionFooter";
import { ApplicationAnswers } from "@/components/Applications/ApplicationAnswers";
import { ApplicationDetails } from "@/components/Applications/ApplicationDetails";
import { ApplicationFiles } from "@/components/Applications/ApplicationFiles";
import { ApplicationHistory } from "@/components/Applications/ApplicationHistory";
import { ApplicationManagement } from "@/components/Applications/ApplicationManagement";
import { ApplicationOnboarding } from "@/components/Applications/ApplicationOnboarding";
import { ApplicationReviewSidebar } from "@/components/Applications/ApplicationReviewSidebar";
import { isApplicantIdentityField } from "@/components/Applications/applicationPresentation";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useApplication } from "@/lib/client/applications/hooks/useApplication";
import type { ApplicationWithFiles, User } from "@/lib/db/types";

export function ApplicationReview({
  initialApplication,
  members,
  organizationDomain,
}: {
  initialApplication: ApplicationWithFiles;
  members: User[];
  organizationDomain: string;
}) {
  const { application, refetch } = useApplication(
    initialApplication._id,
    initialApplication,
  );
  const owners = useMemo(
    () => members.filter((member) => member.memberStatus !== "offboarded"),
    [members],
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
      <PageHeader title={displayName} showBackButton />

      <main
        className="min-w-0 space-y-8 min-[1200px]:h-[calc(100svh-11.75rem)] min-[1200px]:overflow-y-auto min-[1200px]:overscroll-contain min-[1200px]:pr-4 min-[1200px]:[scrollbar-gutter:stable] [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-0"
        aria-label="Bewerbungsinformationen"
      >
        <div className="min-[1200px]:hidden [&>section]:border-t-0 [&>section]:pt-0">
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
          />
        }
      >
        <div className="hidden min-[1200px]:block">
          <ApplicationDetails application={application} />
        </div>
        {!withdrawn ? (
          <div>
            <ApplicationManagement
              key={`management-${revisionKey}`}
              application={application}
              owners={owners}
            />
          </div>
        ) : null}
        {application.status === "accepted" ? (
          <div>
            <ApplicationOnboarding
              key={`onboarding-${revisionKey}`}
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
