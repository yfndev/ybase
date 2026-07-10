"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatters/formatDate";
import {
  type ReimbursementStatus as Status,
  STATUS_DISPLAY,
} from "@/lib/reimbursementStatus";
import { Check, Download, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";

interface ReimbursementRowProps {
  item: {
    _id: string;
    _creationTime: number;
    status: Status;
    rejectionNote?: string;
    projectName: string;
    creatorName: string;
    amount: number;
    reviewedByName?: string;
  };
  canManageReimbursements: boolean;
  description: ReactNode;
  selectionCheckbox?: ReactNode;
  onClick?: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function ReimbursementRow({
  item,
  canManageReimbursements,
  description,
  selectionCheckbox,
  onClick,
  onApprove,
  onReject,
  onDownload,
  onDelete,
}: ReimbursementRowProps) {
  const display = STATUS_DISPLAY[item.status];
  const isPending = item.status === "pending";

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
      <TableCell className="px-1">
        <div className="flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${display.dot}`} />
        </div>
      </TableCell>
      <TableCell>{formatDate(new Date(item._creationTime))}</TableCell>
      <TableCell>{item.projectName}</TableCell>
      <TableCell className="text-muted-foreground">
        {description}
        {item.rejectionNote && (
          <span className="block text-xs text-red-600">
            Ablehnung: {item.rejectionNote}
          </span>
        )}
      </TableCell>
      {canManageReimbursements ? (
        <TableCell>{item.creatorName}</TableCell>
      ) : null}
      <TableCell className="text-right font-medium">
        {item.amount.toFixed(2)} €
      </TableCell>
      <TableCell>
        <Badge variant={display.variant} className={display.className}>
          {display.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {!isPending && item.reviewedByName ? item.reviewedByName : "–"}
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
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onReject}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          {canManageReimbursements && isPending ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
