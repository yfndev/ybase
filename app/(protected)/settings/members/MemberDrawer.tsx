"use client";

import { DetailDrawer } from "@/components/Layout/DetailDrawer";
import type { User } from "@/lib/db/types";
import { useState } from "react";
import type { MemberDrawerProps } from "./MemberDrawer.types";
import { MemberDrawerPanel } from "./MemberDrawerPanel";
import { useMemberDrawerForm } from "./useMemberDrawerForm";

function memberDisplayName(member: User) {
  return (
    member.name ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    "Teammitglied"
  );
}

function MemberDrawerForm({
  onSavingChange,
  ...props
}: MemberDrawerProps & {
  onSavingChange: (isSaving: boolean) => void;
}) {
  const { member, onClose } = props;
  const form = useMemberDrawerForm(props, onSavingChange);
  const displayName = memberDisplayName(member);

  return (
    <MemberDrawerPanel
      member={member}
      displayName={displayName}
      form={form}
      onClose={onClose}
    />
  );
}

export function MemberDrawer(props: MemberDrawerProps) {
  const { member, onClose } = props;
  const [isSaving, setIsSaving] = useState(false);
  const displayName = memberDisplayName(member);

  return (
    <DetailDrawer
      title={displayName}
      description={`Teammitglied ${displayName} bearbeiten`}
      ariaLabel={`Teammitglied ${displayName} bearbeiten`}
      onClose={onClose}
      closeDisabled={isSaving}
    >
      <MemberDrawerForm
        key={`${member._id}:${member.memberStatus}:${member.memberInfractions?.length ?? 0}`}
        {...props}
        onSavingChange={setIsSaving}
      />
    </DetailDrawer>
  );
}
