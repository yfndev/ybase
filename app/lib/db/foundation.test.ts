import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { ensureAppUser } from "../auth/provisioning";
import { getClient, getDb } from "./client";
import { organizations } from "./collections";
import { newId } from "./ids";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybudget_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

beforeEach(async () => {
  const db = await getDb();
  await db.dropDatabase();
});

test("ensureAppUser creates a user and auto-joins an existing org by domain", async () => {
  const organizationId = newId();
  await (await organizations()).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "youngfounders.network",
    createdBy: "seed",
  });

  const user = await ensureAppUser({
    email: "alice@youngfounders.network",
    name: "Alice",
  });

  expect(user.organizationId).toBe(organizationId);
  expect(user.role).toBe("member");
});

test("ensureAppUser is idempotent for the same email", async () => {
  const first = await ensureAppUser({ email: "alice@youngfounders.network" });
  const second = await ensureAppUser({ email: "alice@youngfounders.network" });

  expect(second._id).toBe(first._id);
  const db = await getDb();
  expect(await db.collection("users").countDocuments()).toBe(1);
});

test("ensureAppUser leaves organizationId unset when no org matches the domain", async () => {
  const user = await ensureAppUser({ email: "bob@newverein.de", name: "Bob" });

  expect(user.organizationId).toBeUndefined();
  expect(user.role).toBeUndefined();
});

test("ensureAppUser migrates a legacy lead to admin", async () => {
  const db = await getDb();
  const rawUsers = db.collection<{
    _id: string;
    _creationTime: number;
    email: string;
    organizationId: string;
    role: string;
  }>("users");
  await rawUsers.insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    email: "legacy@youngfounders.network",
    organizationId: newId(),
    role: "lead",
  });

  const user = await ensureAppUser({
    email: "legacy@youngfounders.network",
  });

  expect(user.role).toBe("admin");
  expect(await rawUsers.findOne({ _id: user._id })).toMatchObject({
    role: "admin",
  });
});
