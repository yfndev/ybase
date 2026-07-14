export interface Department {
  _id: string;
  _creationTime: number;
  name: string;
  organizationId: string;
  isArchived: boolean;
  createdBy: string;
}

export interface Team {
  _id: string;
  _creationTime: number;
  name: string;
  departmentId: string;
  organizationId: string;
  isArchived: boolean;
  createdBy: string;
}
