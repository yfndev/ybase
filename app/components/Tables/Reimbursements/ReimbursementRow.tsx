import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { STATUS_DISPLAY } from "@/lib/reimbursementStatus";
import type { ReimbursementStatus as Status } from "@/lib/reimbursementStatus";
import { ReimbursementActionsMenu } from "./ReimbursementActionsMenu";
import { ReimbursementRowMetadata } from "./ReimbursementRowMetadata";

interface ReimbursementRowProps {
  item: {
    _id: string;
    _creationTime: number;
    status: Status;
    projectName: string;
    amount: number;
    reviewedByName?: string;
  };
  canManageReimbursements: boolean;
  canEdit: boolean;
  title: string;
  detail?: string;
  applicantName: string;
  selectionCheckbox?: ReactNode;
  onClick?: () => void;
  onApprove: () => void;
  onMarkAsPaid: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ReimbursementRow({
  item,
  canManageReimbursements,
  canEdit,
  title,
  detail,
  applicantName,
  selectionCheckbox,
  onClick,
  onApprove,
  onMarkAsPaid,
  onRequestChanges,
  onReject,
  onOpen,
  onEdit,
  onDelete,
}: ReimbursementRowProps) {
  const display = STATUS_DISPLAY[item.status];
  const showReviewActions =
    canManageReimbursements && item.status === "pending";
  const showEditAction = canEdit && item.status === "changes_requested";
  const showPaymentAction =
    canManageReimbursements && item.status === "approved";

  return (
    <TableRow
      className={onClick ? "cursor-pointer" : undefined}
      onClick={onClick}
    >
      {selectionCheckbox !== undefined && (
        <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
          {selectionCheckbox}
        </TableCell>
      )}
      <TableCell className="py-3" data-reimbursement-column="request">
        <div className="min-w-0">
          <div className="font-medium text-foreground">{title}</div>
          {detail ? (
            <div className="max-w-72 truncate text-xs text-muted-foreground">
              {detail}
            </div>
          ) : null}
          <ReimbursementRowMetadata
            canManageReimbursements={canManageReimbursements}
            applicantName={applicantName}
            projectName={item.projectName}
            creationTime={item._creationTime}
          />
        </div>
      </TableCell>
      {canManageReimbursements ? (
        <TableCell
          className="max-w-48 truncate"
          data-reimbursement-column="applicant"
        >
          {applicantName}
        </TableCell>
      ) : null}
      <TableCell
        className="max-w-48 truncate"
        data-reimbursement-column="project"
      >
        {item.projectName}
      </TableCell>
      <TableCell
        className="text-muted-foreground"
        data-reimbursement-column="created"
      >
        {formatDate(item._creationTime)}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.amount)}
      </TableCell>
      <TableCell
        className="max-w-48 truncate text-muted-foreground"
        data-reimbursement-column="reviewed-by"
      >
        {item.reviewedByName ?? "–"}
      </TableCell>
      <TableCell
        data-reimbursement-column="status"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant={display.variant} className={display.className}>
            {display.label}
          </Badge>
          <ReimbursementActionsMenu
            showReviewActions={showReviewActions}
            showEditAction={showEditAction}
            showPaymentAction={showPaymentAction}
            canDelete={canManageReimbursements}
            onApprove={onApprove}
            onMarkAsPaid={onMarkAsPaid}
            onRequestChanges={onRequestChanges}
            onReject={onReject}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
