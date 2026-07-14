import type { JobPosting } from "@/lib/db/types";

export interface JobPostingFormValues {
  title: string;
  teamId: string;
  shortText: string;
  description: string;
  tasks: string;
  requirements: string;
  timeCommitment: string;
  location: string;
  isRemote: boolean;
  deadline: string;
  contact: string;
}

export function toJobPostingForm(posting: JobPosting): JobPostingFormValues {
  return {
    title: posting.title,
    teamId: posting.teamId,
    shortText: posting.shortText ?? "",
    description: posting.description ?? "",
    tasks: posting.tasks ?? "",
    requirements: posting.requirements ?? "",
    timeCommitment: posting.timeCommitment ?? "",
    location: posting.location ?? "",
    isRemote: posting.isRemote ?? false,
    deadline: posting.deadline ?? "",
    contact: posting.contact ?? "",
  };
}
