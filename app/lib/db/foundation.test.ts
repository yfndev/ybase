import { expect, test } from "vitest";
import { ensureAppUser } from "../auth/provisioning";
import { setupTestDatabase } from "../test/setupTestDatabase";
import { getDb } from "./client";
import { organizations } from "./collections";
import { newId } from "./ids";

setupTestDatabase();

test("ensureAppUser creates a user and auto-joins an existing org by domain", async () => {
  const organizationId = newId();
  await (
    await organizations()
  ).insertOne({
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

test("ensureAppUser starts a new user in the onboarding lifecycle", async () => {
  const user = await ensureAppUser({ email: "alice@youngfounders.network" });

  expect(user.memberStatus).toBe("onboarding");
  expect(user.teamOnboardingStatus).toBe("not_started");
  expect(typeof user.registeredAt).toBe("number");
});

test("ensureAppUser is idempotent for the same email", async () => {
  const first = await ensureAppUser({ email: "alice@youngfounders.network" });
  const second = await ensureAppUser({ email: "alice@youngfounders.network" });

  expect(second._id).toBe(first._id);
  const db = await getDb();
  expect(await db.collection("users").countDocuments()).toBe(1);
});

test("ensureAppUser updates an existing user from the current login profile", async () => {
  const first = await ensureAppUser({
    email: "alice@youngfounders.network",
    name: "Outdated Name",
  });
  const second = await ensureAppUser({
    email: "alice@youngfounders.network",
    name: "Alice Example",
    firstName: "Alice",
    lastName: "Example",
  });

  expect(second).toMatchObject({
    _id: first._id,
    name: "Alice Example",
    firstName: "Alice",
    lastName: "Example",
  });
});

test("ensureAppUser leaves organizationId unset when no org matches the domain", async () => {
  const user = await ensureAppUser({ email: "bob@newverein.de", name: "Bob" });

  expect(user.organizationId).toBeUndefined();
  expect(user.role).toBeUndefined();
});
