import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireAuthenticatedUser: vi.fn(),
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

import {
  requireAuthenticatedUser,
  requireRole,
  requireUser,
} from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { organizations, projects, users } from "../../db/collections";
import { newId } from "../../db/ids";
import { initializeOrganization, updateOrganization } from "./actions";
import { getOrganization, getOrganizationByDomain } from "./data";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let userA: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybase_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

beforeEach(async () => {
  await (await getDb()).dropDatabase();
  orgA = newId();
  orgB = newId();
  userA = newId();
  await (await organizations()).insertMany([
    { _id: orgA, _creationTime: Date.now(), name: "A", domain: "a.org", createdBy: userA },
    { _id: orgB, _creationTime: Date.now(), name: "B", domain: "b.org", createdBy: newId() },
  ]);
  await (await users()).insertOne({
    _id: userA,
    _creationTime: Date.now(),
    email: "boss@a.org",
    organizationId: orgA,
    role: "admin",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  const actor = {
    _id: userA,
    _creationTime: Date.now(),
    email: "boss@a.org",
    organizationId: orgA,
    role: "admin" as const,
    memberStatus: "active" as const,
    teamOnboardingStatus: "completed" as const,
  };
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

test("getOrganization returns the caller's org settings", async () => {
  await updateOrganization({ street: "Hauptstr. 1", city: "Berlin" });
  const settings = await getOrganization();
  expect(settings.name).toBe("A");
  expect(settings.street).toBe("Hauptstr. 1");
  expect(settings.city).toBe("Berlin");
  expect(settings.plz).toBe("");
});

test("getOrganizationByDomain finds the org for the caller's email domain", async () => {
  const result = await getOrganizationByDomain();
  expect(result).toEqual({ exists: true, organizationName: "A" });
});

test("getOrganizationByDomain reports missing org for an unknown domain", async () => {
  const stranger = {
    _id: newId(),
    _creationTime: Date.now(),
    email: "nobody@unknown.org",
    organizationId: orgA,
    role: "member" as const,
    memberStatus: "active" as const,
    teamOnboardingStatus: "completed" as const,
  };
  vi.mocked(requireUser).mockResolvedValue(stranger);
  expect(await getOrganizationByDomain()).toEqual({ exists: false });
});

test("updateOrganization persists settings and writes a log", async () => {
  await updateOrganization({
    name: "Acme",
    careOf: "z. Hd. Max",
    taxId: "DE123",
  });
  const settings = await getOrganization();
  expect(settings.name).toBe("Acme");
  expect(settings.careOf).toBe("z. Hd. Max");
  expect(settings.taxId).toBe("DE123");

  const log = await (await getDb()).collection("logs").findOne({});
  expect(log?.action).toBe("organization.update");
  expect(log?.organizationId).toBe(orgA);
});

test("updateOrganization stays scoped to the caller's org", async () => {
  await updateOrganization({ name: "Renamed A" });
  const orgBdoc = await (await organizations()).findOne({ _id: orgB });
  expect(orgBdoc?.name).toBe("B");
});

test("initializeOrganization returns the existing org when the caller already has one", async () => {
  const result = await initializeOrganization();
  expect(result).toEqual({ organizationId: orgA, isNew: false });
});

test("initializeOrganization joins an existing org by email domain", async () => {
  const newUser = newId();
  await (await users()).insertOne({
    _id: newUser,
    _creationTime: Date.now(),
    email: "member@b.org",
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });
  vi.mocked(requireAuthenticatedUser).mockResolvedValue({
    _id: newUser,
    _creationTime: Date.now(),
    email: "member@b.org",
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });

  const result = await initializeOrganization();
  expect(result).toEqual({ organizationId: orgB, isNew: false });

  const joined = await (await users()).findOne({ _id: newUser });
  expect(joined?.organizationId).toBe(orgB);
  expect(joined?.role).toBe("member");
});

test("initializeOrganization creates a new org with an Allgemein project", async () => {
  const founder = newId();
  await (await users()).insertOne({
    _id: founder,
    _creationTime: Date.now(),
    email: "founder@fresh.org",
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });
  vi.mocked(requireAuthenticatedUser).mockResolvedValue({
    _id: founder,
    _creationTime: Date.now(),
    email: "founder@fresh.org",
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });

  const result = await initializeOrganization({ organizationName: "Fresh e.V." });
  expect(result.isNew).toBe(true);

  const created = await (await organizations()).findOne({
    _id: result.organizationId,
  });
  expect(created?.name).toBe("Fresh e.V.");
  expect(created?.domain).toBe("fresh.org");

  const project = await (await projects()).findOne({
    organizationId: result.organizationId,
  });
  expect(project?.name).toBe("Allgemein");

  const founderDoc = await (await users()).findOne({ _id: founder });
  expect(founderDoc?.organizationId).toBe(result.organizationId);
  expect(founderDoc?.role).toBe("admin");
  expect(founderDoc?.memberStatus).toBe("active");
  expect(founderDoc?.teamOnboardingStatus).toBe("completed");
});
