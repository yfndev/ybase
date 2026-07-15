import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "./brevo";

const fetchMock = vi.fn();

describe("Brevo email transport", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ messageId: "message-1" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not send without an API key", async () => {
    await expect(
      sendMail({ to: [{ email: "user@example.com" }], templateId: 42 }, {}),
    ).resolves.toEqual({ status: "skipped", reason: "disabled" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks all recipients outside production without an allowlist", async () => {
    await expect(
      sendMail(
        { to: [{ email: "user@example.com" }], templateId: 42 },
        { BREVO_API_KEY: "secret", SERVICE_STAGE: "development" },
      ),
    ).resolves.toEqual({
      status: "skipped",
      reason: "recipient-not-allowed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a template and filters recipients through the allowlist", async () => {
    const result = await sendMail(
      {
        to: [{ email: "allowed@example.com", name: "Allowed" }],
        cc: [
          { email: "blocked@example.com" },
          { email: "allowed@example.com" },
        ],
        templateId: 42,
        subject: "Custom subject",
        replyTo: { email: "accounting@example.com" },
        params: { projectName: "Project" },
        tags: ["ybase"],
      },
      {
        BREVO_API_KEY: "secret",
        SERVICE_STAGE: "development",
        BREVO_RECIPIENT_ALLOWLIST: "allowed@example.com",
      },
    );

    expect(result).toEqual({ status: "sent", messageId: "message-1" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "api-key": "secret" }),
        body: JSON.stringify({
          to: [{ email: "allowed@example.com", name: "Allowed" }],
          cc: undefined,
          templateId: 42,
          subject: "Custom subject",
          replyTo: { email: "accounting@example.com" },
          params: { projectName: "Project" },
          tags: ["ybase"],
        }),
      }),
    );
  });

  it("sends to any recipient in production", async () => {
    await sendMail(
      { to: [{ email: "user@example.com" }], templateId: 42 },
      {
        BREVO_API_KEY: "secret",
        SERVICE_STAGE: "production",
      },
    );

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      to: [{ email: "user@example.com" }],
      templateId: 42,
    });
  });

  it("retries a transient Brevo failure once", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messageId: "message-2" }), {
          status: 201,
        }),
      );

    await expect(
      sendMail(
        { to: [{ email: "user@example.com" }], templateId: 42 },
        { BREVO_API_KEY: "secret", SERVICE_STAGE: "production" },
      ),
    ).resolves.toEqual({ status: "sent", messageId: "message-2" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
