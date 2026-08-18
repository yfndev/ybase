import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));
vi.mock("../../email/urls", () => ({
  appUrl: vi.fn((path: string) => `https://ybase.example${path}`),
}));

import { sendMail } from "../../email/brevo";
import {
  sendGuardianResignationRequest,
  sendResignationConfirmation,
} from "./resignationEmail";

const member = {
  firstName: "Alex",
  lastName: "Example",
  privateEmail: "alex@example.org",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sendMail).mockResolvedValue({
    status: "sent",
    messageId: "mail-1",
  });
});

test("sends the one-time link only to the stored guardian", async () => {
  await expect(
    sendGuardianResignationRequest({
      member,
      guardianName: "Robin Example",
      guardianEmail: "robin@example.org",
      token: "secure-token",
      expectedEndAt: Date.parse("2031-01-01T00:00:00Z"),
      expiresAt: Date.parse("2030-08-21T10:00:00Z"),
    }),
  ).resolves.toBe(true);

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: [{ email: "robin@example.org", name: "Robin Example" }],
      textContent: expect.stringContaining(
        "https://ybase.example/membership/resignation/secure-token",
      ),
    }),
  );
  expect(vi.mocked(sendMail).mock.calls[0][0]).not.toHaveProperty("cc");
});

test("confirms the recorded declaration to the parties and People team", async () => {
  await expect(
    sendResignationConfirmation({
      member,
      receivedAt: Date.parse("2030-08-07T00:00:00Z"),
      scheduledEndAt: Date.parse("2031-01-01T00:00:00Z"),
      guardian: { name: "Robin Example", email: "robin@example.org" },
    }),
  ).resolves.toBe(true);

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: [
        { email: "alex@example.org", name: "Alex Example" },
        { email: "robin@example.org", name: "Robin Example" },
      ],
      cc: [{ email: "people@youngfounders.network" }],
      textContent: expect.stringContaining("Mitgliedschaftsende:"),
    }),
  );
});
