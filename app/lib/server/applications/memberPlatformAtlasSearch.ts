import type { Db, Document } from "mongodb";
import {
  type MemberPlatformProfile,
  normalizeEmail,
} from "../../memberPlatform/suggestions";
import { LINKABLE_MEMBER_PLATFORM_STATES } from "../../memberPlatform/states";

const SEARCH_INDEX = "ybase-search";
const SEARCH_RESULT_LIMIT = 30;

interface ApplicationProfileLookup {
  applicantName?: string;
  privateEmail: string;
}

export async function searchMemberPlatformProfilesWithAtlas(
  database: Db,
  lookup: ApplicationProfileLookup,
): Promise<MemberPlatformProfile[]> {
  return database
    .collection<MemberPlatformProfile>("users")
    .aggregate<MemberPlatformProfile>(buildMemberPlatformSearchPipeline(lookup))
    .toArray();
}

export function buildMemberPlatformSearchPipeline(
  lookup: ApplicationProfileLookup,
): Document[] {
  const should = buildSearchClauses(lookup);
  if (should.length === 0) return [{ $limit: 0 }];
  return [
    {
      $search: {
        index: SEARCH_INDEX,
        compound: { should, minimumShouldMatch: 1 },
      },
    },
    { $match: { deletedAt: null } },
    {
      $lookup: {
        from: "user-states",
        let: { profileId: "$id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$profileId"] },
                  {
                    $in: ["$current", [...LINKABLE_MEMBER_PLATFORM_STATES]],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "eligibleState",
      },
    },
    { $match: { "eligibleState.0": { $exists: true } } },
    {
      $project: {
        _id: 0,
        id: 1,
        person: 1,
        contact: 1,
      },
    },
    { $limit: SEARCH_RESULT_LIMIT },
  ];
}

function buildSearchClauses(lookup: ApplicationProfileLookup): Document[] {
  const clauses: Document[] = [];
  const email = normalizeEmail(lookup.privateEmail);
  if (email) {
    clauses.push({
      equals: {
        path: "contact.email",
        value: email,
        score: { boost: { value: 20 } },
      },
    });
  }

  for (const { path, value } of buildNameValues(lookup.applicantName)) {
    clauses.push(
      {
        equals: {
          path,
          value: value.toLocaleLowerCase("de"),
          score: { boost: { value: 10 } },
        },
      },
      {
        autocomplete: {
          path,
          query: value,
          tokenOrder: "sequential",
          fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
          score: { boost: { value: 4 } },
        },
      },
    );
  }
  return clauses;
}

function buildNameValues(
  applicantName?: string,
): Array<{ path: string; value: string }> {
  const parts = applicantName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const values = new Map<string, { path: string; value: string }>();
  const add = (path: string, value: string) => {
    if (value.length >= 2) values.set(`${path}:${value}`, { path, value });
  };
  if (parts.length === 1) {
    add("person.firstName", parts[0]);
    add("person.lastName", parts[0]);
  }
  for (let splitAt = 1; splitAt < parts.length; splitAt += 1) {
    add("person.firstName", parts.slice(0, splitAt).join(" "));
    add("person.lastName", parts.slice(splitAt).join(" "));
  }
  return [...values.values()];
}
