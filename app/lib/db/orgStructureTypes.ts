export interface Department {
  _id: string;
  _creationTime: number;
  name: string;
  organizationId: string;
  isArchived: boolean;
  createdBy: string;
  websiteSortOrder?: number;
}

export interface Team {
  _id: string;
  _creationTime: number;
  name: string;
  departmentId: string;
  organizationId: string;
  isArchived: boolean;
  createdBy: string;
  websiteSortOrder?: number;
}
