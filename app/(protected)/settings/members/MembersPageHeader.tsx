"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { Department, Team, User } from "@/lib/db/types";
import type { MemberStage } from "@/lib/members/stages";
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import { CreateMemberDialog } from "./CreateMemberDialog";
import { MemberStageTabs } from "./MemberStageTabs";

interface Props {
  stage: MemberStage;
  counts: Record<MemberStage, number>;
  isLoading: boolean;
  onStageChange: (stage: MemberStage) => void;
  onMemberCreated: (member: User) => void;
  departments: Department[];
  teams: Team[];
}

export function MembersPageHeader({
  stage,
  counts,
  isLoading,
  onStageChange,
  onMemberCreated,
  departments,
  teams,
}: Props) {
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Mitglieder" />
        <Button
          type="button"
          variant="ghost"
          className="px-2 sm:px-3"
          onClick={() => setIsCreateMemberOpen(true)}
        >
          <CirclePlus
            aria-hidden="true"
            className="size-5 stroke-[2.5] text-secondary"
          />
          Mitglied anlegen
        </Button>
      </div>
      <MemberStageTabs
        stage={stage}
        counts={counts}
        isLoading={isLoading}
        onChange={onStageChange}
      />
      <CreateMemberDialog
        open={isCreateMemberOpen}
        onOpenChange={setIsCreateMemberOpen}
        onCreated={onMemberCreated}
        departments={departments}
        teams={teams}
      />
    </>
  );
}
