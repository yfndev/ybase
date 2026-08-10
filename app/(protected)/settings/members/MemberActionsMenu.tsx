"use client";

import { Ellipsis, LogOut, UserMinus } from "lucide-react";
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
import { ExcludeMemberDialog } from "./ExcludeMemberDialog";
import { MemberResignationDialog } from "./MemberResignationDialog";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function MemberActionsMenu({
  member,
  canExcludeMembers,
}: {
  member: User;
  canExcludeMembers: boolean;
}) {
  const { excludeOfficialMember, recordResignation } = useMemberMutations();
  const [resignationOpen, setResignationOpen] = useState(false);
  const [exclusionOpen, setExclusionOpen] = useState(false);
  const canRecordResignation =
    Boolean(member.membershipId) &&
    (member.memberStatus === "onboarding" || member.memberStatus === "active");
  const isExclusionRetry =
    member.memberStatus === "excluded" &&
    !member.workspaceAccountDeletedAt &&
    Boolean(member.googleWorkspaceUserId ?? member.email);
  const canExcludeMember =
    canExcludeMembers &&
    Boolean(member.membershipId) &&
    member.memberStatus !== "archived" &&
    (member.memberStatus !== "excluded" || isExclusionRetry);

  if (!canRecordResignation && !canExcludeMember) return null;

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

  const handleExclusion = async () => {
    try {
      await excludeOfficialMember.mutateAsync({ userId: member._id });
      setExclusionOpen(false);
      toast.success("Mitglied ausgeschlossen");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Das Mitglied konnte nicht ausgeschlossen werden.",
      );
    }
  };

  const isPending =
    recordResignation.isPending || excludeOfficialMember.isPending;

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
          {canExcludeMember ? (
            <DropdownMenuItem
              className={`${menu.item} ${menu.destructiveItem}`}
              onSelect={() => setExclusionOpen(true)}
            >
              <UserMinus className="text-current" aria-hidden="true" />
              {isExclusionRetry
                ? "Ausschluss abschließen"
                : "Mitglied ausschließen"}
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
      <ExcludeMemberDialog
        member={member}
        open={exclusionOpen}
        isPending={excludeOfficialMember.isPending}
        isRetry={isExclusionRetry}
        onOpenChange={setExclusionOpen}
        onConfirm={() => void handleExclusion()}
      />
    </>
  );
}
