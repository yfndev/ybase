"use client";

import { Check, ExternalLink, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import {
  STATUS_DISPLAY,
  type ReimbursementStatus as Status,
} from "@/lib/reimbursementStatus";

interface ReimbursementRowProps {
  item: {
    _id: string;
    _creationTime: number;
    status: Status;
    rejectionNote?: string;
    projectName: string;
    amount: number;
    reviewedByName?: string;
  };
  canManageReimbursements: boolean;
  title: string;
  detail?: string;
  applicantName: string;
  selectionCheckbox?: ReactNode;
  onClick?: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

export function ReimbursementRow({
  item,
  canManageReimbursements,
  title,
  detail,
  applicantName,
  selectionCheckbox,
  onClick,
  onApprove,
  onReject,
  onOpen,
  onDelete,
}: ReimbursementRowProps) {
  const display = STATUS_DISPLAY[item.status];
  const isPending = item.status === "pending";
  const reviewerName =
    item.status === "approved" ? item.reviewedByName : undefined;

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
          {reviewerName ? (
            <span className="text-xs text-muted-foreground">
              {reviewerName}
            </span>
          ) : null}
          {item.rejectionNote ? (
            <span
              className="max-w-56 truncate text-xs text-red-700"
              title={`Ablehnungsgrund: ${item.rejectionNote}`}
            >
              Grund: {item.rejectionNote}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          {canManageReimbursements && isPending ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={onApprove}
                aria-label="Genehmigen"
                title="Genehmigen"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onReject}
                aria-label="Ablehnen"
                title="Ablehnen"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onOpen}
            aria-label="PDF in neuem Tab öffnen"
            title="PDF in neuem Tab öffnen"
          >
            <ExternalLink className="h-4 w-4" />
            Öffnen
          </Button>
          {canManageReimbursements && isPending ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDelete}
              aria-label="Löschen"
              title="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
