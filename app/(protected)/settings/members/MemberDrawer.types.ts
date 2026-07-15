import type { Department, Team, User } from "@/lib/db/types";

export interface MemberDrawerProps {
  member: User;
  teams: Team[];
  departments: Department[];
  canEditRoles: boolean;
  adminCount: number;
  onClose: () => void;
}
