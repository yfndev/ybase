import { expect, test } from "vitest";
import { buildMemberPlatformSearchPipeline } from "./memberPlatformAtlasSearch";

test("builds the ybase-search pipeline with boosted email and fuzzy names", () => {
  const pipeline = buildMemberPlatformSearchPipeline({
    applicantName: "Alex Beispiel",
    privateEmail: "ALEX@example.com",
  });
  const search = pipeline[0].$search;

  expect(search.index).toBe("ybase-search");
  expect(search.compound.minimumShouldMatch).toBe(1);
  expect(search.compound.should).toContainEqual({
    equals: {
      path: "contact.email",
      value: "alex@example.com",
      score: { boost: { value: 20 } },
    },
  });
  expect(search.compound.should).toContainEqual({
    autocomplete: {
      path: "person.lastName",
      query: "Beispiel",
      tokenOrder: "sequential",
      fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
      score: { boost: { value: 4 } },
    },
  });
  expect(pipeline).toContainEqual({
    $match: { "eligibleState.0": { $exists: true } },
  });
});
