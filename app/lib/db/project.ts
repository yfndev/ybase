export interface Project {
  _id: string;
  _creationTime: number;
  name: string;
  travelDestination?: string;
  travelPurpose?: string;
  organizationId: string;
  isArchived: boolean;
  createdBy: string;
}

export type ProjectTravelDefaults = Pick<
  Project,
  "travelDestination" | "travelPurpose"
>;
