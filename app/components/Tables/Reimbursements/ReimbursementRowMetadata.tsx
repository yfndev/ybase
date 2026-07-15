import { formatDate } from "@/lib/formatters/formatDate";

type Props = {
  canManageReimbursements: boolean;
  applicantName: string;
  projectName: string;
  creationTime: number;
};

export function ReimbursementRowMetadata({
  canManageReimbursements,
  applicantName,
  projectName,
  creationTime,
}: Props) {
  return (
    <div data-reimbursement-mobile-metadata>
      {canManageReimbursements ? (
        <span data-mobile-metadata="applicant" data-reimbursement-metadata-item>
          {applicantName}
        </span>
      ) : null}
      <span data-mobile-metadata="project" data-reimbursement-metadata-item>
        {projectName}
      </span>
      <span data-mobile-metadata="created" data-reimbursement-metadata-item>
        {formatDate(creationTime)}
      </span>
    </div>
  );
}
