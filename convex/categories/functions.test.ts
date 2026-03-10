import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("get all categories", async () => {
  const t = convexTest(schema, modules);
  const { categoryId } = await setupTestData(t);

  const categories = await t.query(
    api.categories.functions.getAllCategories,
    {},
  );

  expect(categories.length).toBeGreaterThanOrEqual(1);
  expect(categories.some((cat) => cat._id === categoryId)).toBe(true);
});
