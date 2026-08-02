import type { JobPosting, JobPostingUrgency } from "@/lib/db/types";
import { jobPostingApplicationQuestions } from "./applicationQuestions";
import { DEFAULT_JOB_POSTING_BENEFITS } from "./benefits";
import type { JobPostingTimeCommitment } from "./timeCommitment";
import { jobPostingUrgency } from "./urgency";

export interface JobPostingFormValues {
  title: string;
  teamId: string;
  urgency: JobPostingUrgency;
  shortText: string;
  description: string;
  tasks: string;
  requirements: string;
  benefits: string;
  timeCommitment: JobPostingTimeCommitment | "";
  location: string;
  isRemote: boolean;
  deadline: string;
  contactUserIds: string[];
  applicationQuestions: string[];
}

export function toJobPostingForm(posting: JobPosting): JobPostingFormValues {
  return {
    title: posting.title,
    teamId: posting.teamId,
    urgency: jobPostingUrgency(posting.urgency),
    shortText: posting.shortText ?? "",
    description: posting.description ?? "",
    tasks: posting.tasks ?? "",
    requirements: posting.requirements ?? "",
    benefits: posting.benefits ?? DEFAULT_JOB_POSTING_BENEFITS,
    timeCommitment: posting.timeCommitment ?? "",
    location: posting.location ?? "",
    isRemote: posting.isRemote ?? false,
    deadline: posting.deadline ?? "",
    contactUserIds: posting.contactUserIds ?? [],
    applicationQuestions: jobPostingApplicationQuestions(
      posting.applicationQuestions,
    ),
  };
}
