"use client";

import {
  Check,
  ExternalLink,
  MessageSquareWarning,
  MoreHorizontal,
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
import {
  STATUS_DISPLAY,
  type ReimbursementStatus as Status,
} from "@/lib/reimbursementStatus";
import styles from "./ReimbursementRow.module.css";

interface ReimbursementRowProps {
  item: {
    _id: string;
    _creationTime: number;
    status: Status;
    rejectionNote?: string;
    reviewNote?: string;
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
  const isPending = item.status === "pending";
  const showReviewActions = canManageReimbursements && isPending;
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
      <TableCell className="min-w-56 py-3">
        <div className="min-w-0">
          <div className="font-medium text-foreground">{title}</div>
          {detail ? (
            <div className="max-w-72 truncate text-xs text-muted-foreground">
              {detail}
            </div>
          ) : null}
        </div>
      </TableCell>
      {canManageReimbursements ? (
        <TableCell className="max-w-48 truncate">{applicantName}</TableCell>
      ) : null}
      <TableCell className="max-w-48 truncate">{item.projectName}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(item._creationTime)}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.amount)}
      </TableCell>
      <TableCell className="min-w-40">
        <div className="flex flex-col items-start gap-1">
          <Badge variant={display.variant} className={display.className}>
            {display.label}
          </Badge>
          {item.rejectionNote ? (
            <span
              className="max-w-56 truncate text-xs text-red-700"
              title={`Ablehnungsgrund: ${item.rejectionNote}`}
            >
              Grund: {item.rejectionNote}
            </span>
          ) : null}
          {item.reviewNote ? (
            <span
              className="max-w-56 truncate text-xs text-orange-700"
              title={`Angeforderte Änderungen: ${item.reviewNote}`}
            >
              Änderung: {item.reviewNote}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="max-w-48 truncate text-muted-foreground">
        {item.reviewedByName ?? "–"}
      </TableCell>
      <TableCell
        className="w-12 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={styles.menuTrigger}
              aria-label="Aktionen anzeigen"
              title="Aktionen anzeigen"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={0} className={styles.menuContent}>
            {showReviewActions ? (
              <>
                <DropdownMenuItem
                  className={styles.menuItem}
                  onSelect={onApprove}
                >
                  <Check className="text-current" />
                  Genehmigen
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={styles.menuItem}
                  onSelect={onRequestChanges}
                >
                  <MessageSquareWarning className="text-current" />
                  Änderungen anfordern
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`${styles.menuItem} ${styles.destructiveMenuItem}`}
                  onSelect={onReject}
                >
                  <X className="text-current" />
                  Ablehnen
                </DropdownMenuItem>
              </>
            ) : null}
            {showEditAction ? (
              <DropdownMenuItem className={styles.menuItem} onSelect={onEdit}>
                <Pencil className="text-current" />
                Bearbeiten
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem className={styles.menuItem} onSelect={onOpen}>
              <ExternalLink className="text-current" />
              Öffnen
            </DropdownMenuItem>
            {showReviewActions ? (
              <DropdownMenuItem
                className={`${styles.menuItem} ${styles.destructiveMenuItem}`}
                onSelect={onDelete}
              >
                <Trash2 className="text-current" />
                Löschen
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
