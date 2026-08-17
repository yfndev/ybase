import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock("../../email/brevo", () => ({ sendMail: mocks.sendMail }));
vi.mock("../../db/collections", () => ({
  reimbursements: vi.fn(async () => ({
    findOne: async () => ({
      _id: "r1",
      organizationId: "o1",
      projectId: "p1",
      createdBy: "u1",
      type: "expense",
      amount: 122.98,
      currency: null,
    }),
  })),
  users: vi.fn(async () => ({
    findOne: async () => ({
      _id: "u1",
      name: "Alex",
      email: "alex@example.com",
    }),
  })),
  projects: vi.fn(async () => ({
    findOne: async () => ({ _id: "p1", name: "Projekt A" }),
  })),
}));

import { sendApprovalEmail } from "./email";

beforeEach(() => {
  mocks.sendMail.mockReset();
  mocks.sendMail.mockResolvedValue({ status: "sent" });
  vi.stubEnv("BREVO_API_KEY", "secret");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.test");
});

it("formats the amount in euro when no currency is stored", async () => {
  await sendApprovalEmail("r1");

  expect(mocks.sendMail.mock.calls[0][0].params.amount).toBe("122,98\u00a0€");
});
