"use client";

import { LogOut, UserMinus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
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
  const isDisabled = isFormSaving || isPending;

  return (
    <>
      {canRecordResignation ? (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={() => setResignationOpen(true)}
        >
          <LogOut aria-hidden="true" />
          Austritt erfassen
        </Button>
      ) : null}
      {canExcludeMember ? (
        <Button
          type="button"
          variant="destructive"
          disabled={isDisabled}
          onClick={() => setExclusionOpen(true)}
        >
          <UserMinus aria-hidden="true" />
          {isExclusionRetry
            ? "Ausschluss abschließen"
            : "Mitglied ausschließen"}
        </Button>
      ) : null}

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
