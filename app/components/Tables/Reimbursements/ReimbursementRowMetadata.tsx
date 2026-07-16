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
    <div className="mt-0.5 flex max-w-72 gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
      {canManageReimbursements ? (
        <span className="min-w-0 overflow-hidden text-ellipsis @min-[39rem]/reimbursement-table:hidden">
          {applicantName}
        </span>
      ) : null}
      <span
        className="min-w-0 overflow-hidden text-ellipsis @min-[60rem]/reimbursement-table:hidden"
        data-mobile-metadata="project"
      >
        {projectName}
      </span>
      <span className="min-w-0 overflow-hidden text-ellipsis @min-[48rem]/reimbursement-table:hidden">
        {formatDate(creationTime)}
      </span>
    </div>
  );
}
