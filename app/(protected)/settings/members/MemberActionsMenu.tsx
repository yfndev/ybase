"use client";

import { Ellipsis, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verticalActionMenuClassNames as menu } from "@/components/ui/vertical-action-menu";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { User } from "@/lib/db/types";
import { DeleteMemberAccountDialog } from "./DeleteMemberAccountDialog";
import { MemberResignationDialog } from "./MemberResignationDialog";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function MemberActionsMenu({
  member,
  canDeleteAccount,
}: {
  member: User;
  canDeleteAccount: boolean;
}) {
  const { deleteWorkspaceAccount, recordResignation } = useMemberMutations();
  const [resignationOpen, setResignationOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canRecordResignation =
    Boolean(member.membershipId) &&
    (member.memberStatus === "onboarding" || member.memberStatus === "active");
  const canDeleteWorkspaceAccount =
    canDeleteAccount &&
    member.role !== "admin" &&
    !member.workspaceAccountDeletedAt &&
    Boolean(member.googleWorkspaceUserId ?? member.email);

  if (!canRecordResignation && !canDeleteWorkspaceAccount) return null;

  const handleResignation = async (receivedOn: string) => {
    try {
      const result = await recordResignation.mutateAsync({
        userId: member._id,
        receivedOn,
      });
      setResignationOpen(false);
      toast.success(
        `Austritt zum ${DATE_FORMAT.format(result.scheduledEndAt - 1)} erfasst`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Der Austritt konnte nicht erfasst werden.",
      );
    }
  };

  const handleAccountDeletion = async () => {
    try {
      await deleteWorkspaceAccount.mutateAsync({ userId: member._id });
      setDeleteOpen(false);
      toast.success("Google Workspace-Konto gelöscht");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Das Workspace-Konto konnte nicht gelöscht werden.",
      );
    }
  };

  const isPending =
    recordResignation.isPending || deleteWorkspaceAccount.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={`${menu.trigger} mt-1 shrink-0`}
            disabled={isPending}
            aria-label={`Aktionen für ${member.name ?? member.email ?? "dieses Mitglied"} anzeigen`}
            title="Aktionen anzeigen"
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className={menu.content}
        >
          {canRecordResignation ? (
            <DropdownMenuItem
              className={menu.item}
              onSelect={() => setResignationOpen(true)}
            >
              <LogOut className="text-current" aria-hidden="true" />
              Austritt erfassen
            </DropdownMenuItem>
          ) : null}
          {canDeleteWorkspaceAccount ? (
            <DropdownMenuItem
              className={`${menu.item} ${menu.destructiveItem}`}
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="text-current" aria-hidden="true" />
              Account löschen
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <MemberResignationDialog
        member={member}
        open={resignationOpen}
        isPending={recordResignation.isPending}
        onOpenChange={setResignationOpen}
        onSubmit={handleResignation}
      />
      <DeleteMemberAccountDialog
        member={member}
        open={deleteOpen}
        isDeleting={deleteWorkspaceAccount.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleAccountDeletion()}
      />
    </>
  );
}
