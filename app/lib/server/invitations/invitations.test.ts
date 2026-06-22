import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("../../email/resend", () => ({ sendEmail: vi.fn() }));

import { requireUser } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { organizations } from "../../db/collections";
import { newId } from "../../db/ids";
import { sendEmail } from "../../email/resend";
import { sendInvitation } from "./actions";

let mongod: MongoMemoryServer;
let orgA: string;
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
  vi.mocked(sendEmail).mockReset();
  orgA = newId();
  userA = newId();
  await (await organizations()).insertOne({
    _id: orgA,
    _creationTime: Date.now(),
    name: "A",
    domain: "a.org",
    createdBy: userA,
  });
  const actor = {
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "admin" as const,
    firstName: "Angela",
  };
  vi.mocked(requireUser).mockResolvedValue(actor);
});

test("sendInvitation sends an email to the invited recipient", async () => {
  await sendInvitation({ name: "Max Mustermann", email: "max@mustermann.de" });

  expect(sendEmail).toHaveBeenCalledTimes(1);
  const message = vi.mocked(sendEmail).mock.calls[0][0];
  expect(message.to).toBe("max@mustermann.de");
  expect(message.subject).toBe("Einladung zu YBase");
  expect(message.from).toBe("YBase <info@youngfounders.network>");
  expect(message.html).toContain("Hey Max");
  expect(message.html).toContain("von Angela");
});

test("sendInvitation rejects an unauthenticated caller", async () => {
  vi.mocked(requireUser).mockRejectedValue(new Error("Unauthorized user"));

  await expect(
    sendInvitation({ name: "Max", email: "max@mustermann.de" }),
  ).rejects.toThrow("Unauthorized user");
  expect(sendEmail).not.toHaveBeenCalled();
});
