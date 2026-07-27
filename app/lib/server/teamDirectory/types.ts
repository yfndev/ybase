export interface TeamDirectoryMemberV1 {
  id: string;
  name: string;
  role: string;
  isLead: boolean;
  sortOrder: number;
}

export interface TeamDirectoryBoardMemberV1 {
  id: string;
  name: string;
  role: string;
  isChair: boolean;
  sortOrder: number;
}

export interface TeamDirectoryTeamV1 {
  id: string;
  name: string;
  sortOrder: number;
  members: TeamDirectoryMemberV1[];
}

export interface TeamDirectoryDepartmentV1 {
  id: string;
  name: string;
  sortOrder: number;
  teams: TeamDirectoryTeamV1[];
}

export interface TeamDirectoryDataV1 {
  board: TeamDirectoryBoardMemberV1[];
  departments: TeamDirectoryDepartmentV1[];
}

export interface TeamDirectoryFeedV1 {
  version: "v1";
  generatedAt: string;
  revision: string;
  data: TeamDirectoryDataV1;
}
