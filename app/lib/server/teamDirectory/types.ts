export interface TeamDirectoryMember {
  id: string;
  name: string;
  role: string;
}

export interface TeamDirectoryTeam {
  id: string;
  name: string;
  members: TeamDirectoryMember[];
}

export interface TeamDirectoryDepartment {
  id: string;
  name: string;
  teams: TeamDirectoryTeam[];
}

export interface TeamDirectoryData {
  departments: TeamDirectoryDepartment[];
}

export interface TeamDirectoryFeed {
  version: "v1";
  generatedAt: string;
  revision: string;
  data: TeamDirectoryData;
}
