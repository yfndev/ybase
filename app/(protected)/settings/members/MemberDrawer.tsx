"use client";

import { DetailDrawer } from "@/components/Layout/DetailDrawer";
import type { MemberDrawerProps } from "./MemberDrawer.types";
import { MemberDrawerPanel } from "./MemberDrawerPanel";
import { useMemberDrawerForm } from "./useMemberDrawerForm";

export function MemberDrawer(props: MemberDrawerProps) {
  const { member, onClose } = props;
  const form = useMemberDrawerForm(props);
  const displayName =
    member.name ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    "Teammitglied";
  const content = (
    <MemberDrawerPanel
      member={member}
      displayName={displayName}
      form={form}
      onClose={onClose}
    />
  );

  return (
    <DetailDrawer
      title={displayName}
      description={`Teammitglied ${displayName} bearbeiten`}
      ariaLabel={`Teammitglied ${displayName} bearbeiten`}
      onClose={onClose}
      closeDisabled={form.isSaving}
    >
      {content}
    </DetailDrawer>
  );
}
