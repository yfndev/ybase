export interface TeamDirectoryMember {
  id: string;
  name: string;
  role: string;
  isLead: boolean;
  imageUrl?: string;
}

export interface TeamDirectoryBoardMember {
  id: string;
  departmentId: string;
  name: string;
  role: string;
  isChair: boolean;
  imageUrl?: string;
}

export interface TeamDirectoryTeam {
  id: string;
  name: string;
  isChapter: boolean;
  members: TeamDirectoryMember[];
}

export interface TeamDirectoryDepartment {
  id: string;
  name: string;
  teams: TeamDirectoryTeam[];
}

export interface TeamDirectoryData {
  board: TeamDirectoryBoardMember[];
  departments: TeamDirectoryDepartment[];
}

export interface TeamDirectoryFeed {
  version: "v1";
  generatedAt: string;
  revision: string;
  data: TeamDirectoryData;
}
