import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, inject } from "vitest";
import { getClient, getDb } from "../db/client";

export function setupTestDatabase() {
  const databaseName = `ybase_test_${randomUUID().replaceAll("-", "")}`;

  beforeAll(async () => {
    process.env.MONGODB_URI = inject("mongoUri");
    process.env.MONGODB_DB = databaseName;
  });

  afterAll(async () => {
    const client = await getClient();
    await client.db(databaseName).dropDatabase();
    await client.close();
  }, 30_000);

  beforeEach(async () => {
    const db = await getDb();
    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();
    await Promise.all(
      collections.map(({ name }) => db.collection(name).deleteMany({})),
    );
  });
}
