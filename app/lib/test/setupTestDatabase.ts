import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { getClient, getDb } from "../db/client";

export function setupTestDatabase() {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    process.env.MONGODB_URI = server.getUri();
    process.env.MONGODB_DB = "ybase_test";
  }, 120_000);

  afterAll(async () => {
    const client = await getClient();
    await client.close();
    await server.stop();
  }, 30_000);

  beforeEach(async () => {
    await (await getDb()).dropDatabase();
  });
}
