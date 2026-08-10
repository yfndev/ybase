"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { User } from "@/lib/db/types";
import { ExcludeMemberDialog } from "./ExcludeMemberDialog";
import { MemberResignationDialog } from "./MemberResignationDialog";
import { MembershipEndChoiceDialog } from "./MembershipEndChoiceDialog";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type OpenDialog = "choice" | "resignation" | "exclusion";

export function MemberMembershipActions({
  member,
  canExcludeMembers,
  isFormSaving,
}: {
  member: User;
  canExcludeMembers: boolean;
  isFormSaving: boolean;
}) {
  const { excludeOfficialMember, recordResignation } = useMemberMutations();
  const [openDialog, setOpenDialog] = useState<OpenDialog>();
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
      setOpenDialog(undefined);
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
      setOpenDialog(undefined);
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
  const isDisabled = isFormSaving || isPending;
  const hasMultipleActions = canRecordResignation && canExcludeMember;
  let triggerLabel = "Mitglied ausschließen";
  if (canRecordResignation) triggerLabel = "Austritt erfassen";
  if (hasMultipleActions) triggerLabel = "Mitgliedschaft beenden";
  if (isExclusionRetry) triggerLabel = "Ausschluss abschließen";

  const openMembershipEnd = () => {
    if (hasMultipleActions) {
      setOpenDialog("choice");
      return;
    }
    setOpenDialog(canRecordResignation ? "resignation" : "exclusion");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isDisabled}
        onClick={openMembershipEnd}
      >
        <LogOut aria-hidden="true" />
        {triggerLabel}
      </Button>

      <MembershipEndChoiceDialog
        member={member}
        open={openDialog === "choice"}
        onOpenChange={(open) => !open && setOpenDialog(undefined)}
        onChooseResignation={() => setOpenDialog("resignation")}
        onChooseExclusion={() => setOpenDialog("exclusion")}
      />

      <MemberResignationDialog
        member={member}
        open={openDialog === "resignation"}
        isPending={recordResignation.isPending}
        onOpenChange={(open) => !open && setOpenDialog(undefined)}
        onSubmit={handleResignation}
      />
      <ExcludeMemberDialog
        member={member}
        open={openDialog === "exclusion"}
        isPending={excludeOfficialMember.isPending}
        isRetry={isExclusionRetry}
        onOpenChange={(open) => !open && setOpenDialog(undefined)}
        onConfirm={() => void handleExclusion()}
      />
    </>
  );
}
