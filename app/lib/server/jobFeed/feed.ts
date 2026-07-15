import { berlinToday } from "../../jobPostings/deadline";
import {
  departments,
  jobPostings,
  organizations,
  teams,
  users,
} from "../../db/collections";
import type { JobPosting, User } from "../../db/types";

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
          contactUserIds: 1,
          tallyFormId: 1,
        },
      },
    )
    .sort({ _creationTime: -1 })
    .toArray();

  const teamIds = [...new Set(postings.map((posting) => posting.teamId))];
  const contactUserIds = [
    ...new Set(postings.flatMap((posting) => posting.contactUserIds ?? [])),
  ];
  const [ownedTeams, contactUsers] = await Promise.all([
    (await teams()).find({ _id: { $in: teamIds }, organizationId }).toArray(),
    (await users())
      .find({
        _id: { $in: contactUserIds },
        organizationId,
        memberStatus: { $ne: "offboarded" },
      })
      .project<Pick<User, "_id" | "name" | "email">>({
        _id: 1,
        name: 1,
        email: 1,
      })
      .toArray(),
  ]);
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
  const contactsById = new Map(
    contactUsers.map((contact) => [contact._id, contact]),
  );

  return postings.map((posting) =>
    toFeedItem(
      posting,
      organizationId,
      organization.name,
      teamsById,
      departmentsById,
      contactsById,
    ),
  );
}

function toFeedItem(
  posting: JobPosting,
  organizationId: string,
  organizationName: string,
  teamsById: Map<string, { name: string; departmentId: string }>,
  departmentsById: Map<string, { name: string }>,
  contactsById: Map<string, Pick<User, "_id" | "name" | "email">>,
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
    contact: formatContacts(posting, contactsById),
    tallyUrl: tallyUrl(posting.tallyFormId),
    tags: [JOB_FEED_TAG],
  };
}

function formatContacts(
  posting: JobPosting,
  contactsById: Map<string, Pick<User, "_id" | "name" | "email">>,
): string {
  const contacts = (posting.contactUserIds ?? []).flatMap((contactUserId) => {
    const contact = contactsById.get(contactUserId);
    return contact ? [contact] : [];
  });
  return contacts
    .map((contact) => contact.name?.trim() || contact.email?.trim())
    .filter(Boolean)
    .join(", ");
}
