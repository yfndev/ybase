import type { User } from "@/lib/db/types";
import { useState } from "react";

export function useBoardMembershipForm(member: User) {
  const [isBoardMember, setIsBoardMember] = useState(
    member.boardMembership !== undefined,
  );
  const [boardDepartmentId, setBoardDepartmentId] = useState(
    member.boardMembership?.departmentId ?? "",
  );
  const [boardIsChair, setBoardIsChair] = useState(
    member.boardMembership?.isChair ?? false,
  );
  const [boardSecondaryRole, setBoardSecondaryRole] = useState(
    member.boardMembership?.secondaryRole ?? "",
  );

  return {
    isBoardMember,
    setIsBoardMember,
    boardDepartmentId,
    setBoardDepartmentId,
    boardIsChair,
    setBoardIsChair,
    boardSecondaryRole,
    setBoardSecondaryRole,
  };
}
