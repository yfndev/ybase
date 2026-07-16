import {
  Check,
  ExternalLink,
  MessageSquareWarning,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { STATUS_DISPLAY } from "@/lib/reimbursementStatus";
import type { ReimbursementStatus as Status } from "@/lib/reimbursementStatus";
import { ReimbursementRowMetadata } from "./ReimbursementRowMetadata";
import { reimbursementColumnClassNames as columns } from "./reimbursementTableClasses";

const menuItemClassName =
  "relative flex cursor-pointer flex-wrap items-center gap-4 rounded-none px-4 py-3 font-medium text-foreground outline-none select-none data-[highlighted]:bg-primary data-[highlighted]:text-black [&_svg]:size-6";

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
      <TableCell className={`${columns.request} py-3`}>
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
        <TableCell className={`${columns.applicant} max-w-48 truncate`}>
          {applicantName}
        </TableCell>
      ) : null}
      <TableCell className={`${columns.project} max-w-48 truncate`}>
        {item.projectName}
      </TableCell>
      <TableCell className={`${columns.created} text-muted-foreground`}>
        {formatDate(item._creationTime)}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.amount)}
      </TableCell>
      <TableCell
        className={`${columns.reviewedBy} max-w-48 truncate text-muted-foreground`}
      >
        {item.reviewedByName ?? "–"}
      </TableCell>
      <TableCell
        className={columns.status}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant={display.variant} className={display.className}>
            {display.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-[0.25rem] border-0 bg-transparent text-foreground shadow-none transition-colors duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:shadow-none [&_svg]:size-6"
                aria-label="Aktionen anzeigen"
                title="Aktionen anzeigen"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={0}
              className="min-w-[220px] animate-menu-enter rounded-[0.125rem] border-0 bg-background p-0 text-foreground shadow-member-menu will-change-[transform,opacity] motion-reduce:animate-none data-[side=bottom]:[--menu-enter-y:2px] data-[side=left]:[--menu-enter-x:2px] data-[side=right]:[--menu-enter-x:-2px] data-[side=top]:[--menu-enter-y:-2px] [&>*:not(:last-child)]:border-b"
            >
              {showReviewActions ? (
                <>
                  <DropdownMenuItem
                    className={menuItemClassName}
                    onSelect={onApprove}
                  >
                    <Check className="text-current" />
                    Genehmigen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={menuItemClassName}
                    onSelect={onRequestChanges}
                  >
                    <MessageSquareWarning className="text-current" />
                    Änderungen anfordern
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`${menuItemClassName} text-destructive`}
                    onSelect={onReject}
                  >
                    <X className="text-current" />
                    Ablehnen
                  </DropdownMenuItem>
                </>
              ) : null}
              {showEditAction ? (
                <DropdownMenuItem
                  className={menuItemClassName}
                  onSelect={onEdit}
                >
                  <Pencil className="text-current" />
                  Bearbeiten
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem className={menuItemClassName} onSelect={onOpen}>
                <ExternalLink className="text-current" />
                Öffnen
              </DropdownMenuItem>
              {canManageReimbursements ? (
                <DropdownMenuItem
                  className={`${menuItemClassName} text-destructive`}
                  onSelect={onDelete}
                >
                  <Trash2 className="text-current" />
                  Löschen
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
