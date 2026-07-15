import { berlinToday } from "../../jobPostings/deadline";
import {
  departments,
  jobPostings,
  organizations,
  teams,
} from "../../db/collections";
import type { JobPosting } from "../../db/types";

export const JOB_FEED_TAG = "YFN_TEAM" as const;

export interface JobFeedItemV1 {
  id: string;
  title: string;
  yfn: string;
  shortText: string;
  content: {
    description: string;
    tasks: string;
    requirements: string;
  };
  team: string;
  department: string;
  timeCommitment: string;
  location: string;
  deadline: string | null;
  contact: string;
  tallyUrl: string;
  tags: [typeof JOB_FEED_TAG];
}

function namespacedId(organizationId: string, postingId: string): string {
  return `ybase:${organizationId}:job-posting:${postingId}`;
}

function tallyUrl(formId: string | undefined): string {
  return formId ? `https://tally.so/r/${encodeURIComponent(formId)}` : "";
}

export async function getJobFeedV1(
  organizationId: string,
  today: string = berlinToday(),
): Promise<JobFeedItemV1[]> {
  const organization = await (
    await organizations()
  ).findOne({ _id: organizationId }, { projection: { name: 1 } });
  if (!organization) return [];

  const postings = await (
    await jobPostings()
  )
    .find(
      {
        organizationId,
        status: "published",
        $or: [
          { deadline: { $exists: false } },
          { deadline: "" },
          { deadline: { $gte: today } },
        ],
      },
      {
        projection: {
          _id: 1,
          title: 1,
          shortText: 1,
          description: 1,
          tasks: 1,
          requirements: 1,
          teamId: 1,
          timeCommitment: 1,
          location: 1,
          deadline: 1,
          contact: 1,
          tallyFormId: 1,
        },
      },
    )
    .sort({ _creationTime: -1 })
    .toArray();

  const teamIds = [...new Set(postings.map((posting) => posting.teamId))];
  const ownedTeams = await (await teams())
    .find({ _id: { $in: teamIds }, organizationId })
    .toArray();
  const departmentIds = [
    ...new Set(ownedTeams.map((team) => team.departmentId)),
  ];
  const ownedDepartments = await (await departments())
    .find({ _id: { $in: departmentIds }, organizationId })
    .toArray();
  const teamsById = new Map(ownedTeams.map((team) => [team._id, team]));
  const departmentsById = new Map(
    ownedDepartments.map((department) => [department._id, department]),
  );

  return postings.map((posting) =>
    toFeedItem(
      posting,
      organizationId,
      organization.name,
      teamsById,
      departmentsById,
    ),
  );
}

function toFeedItem(
  posting: JobPosting,
  organizationId: string,
  organizationName: string,
  teamsById: Map<string, { name: string; departmentId: string }>,
  departmentsById: Map<string, { name: string }>,
): JobFeedItemV1 {
  const team = teamsById.get(posting.teamId);
  const department = team ? departmentsById.get(team.departmentId) : undefined;

  return {
    id: namespacedId(organizationId, posting._id),
    title: posting.title,
    yfn: organizationName,
    shortText: posting.shortText ?? "",
    content: {
      description: posting.description ?? "",
      tasks: posting.tasks ?? "",
      requirements: posting.requirements ?? "",
    },
    team: team?.name ?? "",
    department: department?.name ?? "",
    timeCommitment: posting.timeCommitment ?? "",
    location: posting.location ?? "",
    deadline: posting.deadline || null,
    contact: posting.contact ?? "",
    tallyUrl: tallyUrl(posting.tallyFormId),
    tags: [JOB_FEED_TAG],
  };
}
