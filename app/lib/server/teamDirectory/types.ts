export interface TeamDirectoryMemberV1 {
  id: string;
  name: string;
  role: string;
}

export interface TeamDirectoryTeamV1 {
  id: string;
  name: string;
  members: TeamDirectoryMemberV1[];
}

export interface TeamDirectoryDepartmentV1 {
  id: string;
  name: string;
  teams: TeamDirectoryTeamV1[];
}

export interface TeamDirectoryDataV1 {
  departments: TeamDirectoryDepartmentV1[];
}

export interface TeamDirectoryFeedV1 {
  version: "v1";
  generatedAt: string;
  revision: string;
  data: TeamDirectoryDataV1;
}
