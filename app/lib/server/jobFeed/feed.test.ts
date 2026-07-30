import { expect, test } from "vitest";
import { departments, jobPostings, teams } from "../../db/collections";
import { newId } from "../../db/ids";
import type { JobPosting } from "../../db/types";
import { DEFAULT_JOB_POSTING_BENEFITS } from "../../jobPostings/benefits";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { getJobFeedV1 } from "./feed";

setupTestDatabase();

async function insertPublishedPosting(
  overrides: Partial<JobPosting> = {},
): Promise<{ organizationId: string }> {
  const organizationId = newId();
  const createdBy = newId();
  const departmentId = newId();
  const teamId = newId();
  await (
    await departments()
  ).insertOne({
    _id: departmentId,
    _creationTime: Date.now(),
    name: "Community",
    organizationId,
    isArchived: false,
    createdBy,
  });
  await (
    await teams()
  ).insertOne({
    _id: teamId,
    _creationTime: Date.now(),
    name: "Partnerships",
    departmentId,
    organizationId,
    isArchived: false,
    createdBy,
  });
  await (
    await jobPostings()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    teamId,
    status: "published",
    title: "Partnerships Lead",
    createdBy,
    ...overrides,
  });
  return { organizationId };
}

test("includes rich-text benefits in the member-platform job feed", async () => {
  const benefits =
    "<ul><li><strong>Direkter Impact:</strong> Du schaffst Mehrwert.</li></ul>";
  const { organizationId } = await insertPublishedPosting({ benefits });

  const [item] = await getJobFeedV1(organizationId);

  expect(item.content.benefits).toBe(benefits);
});

test("supplies default benefits for existing postings without the field", async () => {
  const { organizationId } = await insertPublishedPosting();

  const [item] = await getJobFeedV1(organizationId);

  expect(item.content.benefits).toBe(DEFAULT_JOB_POSTING_BENEFITS);
});
