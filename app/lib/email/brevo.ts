export type EmailRecipient = {
  email: string;
  name?: string;
};

export type BrevoDeliveryResult =
  | { status: "sent"; messageId?: string }
  | { status: "skipped"; reason: "disabled" | "recipient-not-allowed" };

type BrevoEnvironment = {
  [key: string]: string | undefined;
  BREVO_API_KEY?: string;
  BREVO_RECIPIENT_ALLOWLIST?: string;
  SERVICE_STAGE?: string;
};

type MailMessage = {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  templateId: number;
  params?: Record<string, unknown>;
  tags?: string[];
};

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;

function uniqueRecipients(recipients: EmailRecipient[]): EmailRecipient[] {
  const seen = new Set<string>();
  return recipients.filter(({ email }) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function allowedRecipients(
  recipients: EmailRecipient[],
  allowlistValue?: string,
): EmailRecipient[] {
  if (!allowlistValue?.trim()) return recipients;

  const allowlist = new Set(
    allowlistValue
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  return recipients.filter(({ email }) =>
    allowlist.has(email.trim().toLowerCase()),
  );
}

async function deliverMail(
  apiKey: string,
  message: MailMessage,
): Promise<{ messageId?: string }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(BREVO_EMAIL_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      continue;
    }

    if (response.ok) {
      return (await response.json()) as { messageId?: string };
    }

    const error = new Error(
      `Brevo request failed with status ${response.status}: ${await response.text()}`,
    );
    if (response.status !== 429 && response.status < 500) throw error;
    lastError = error;
  }

  throw lastError;
}

export async function sendMail(
  message: MailMessage,
  env: BrevoEnvironment = process.env,
): Promise<BrevoDeliveryResult> {
  if (!env.BREVO_API_KEY) {
    return { status: "skipped", reason: "disabled" };
  }

  const allowlist =
    env.SERVICE_STAGE === "production"
      ? undefined
      : env.BREVO_RECIPIENT_ALLOWLIST;
  if (env.SERVICE_STAGE !== "production" && !allowlist?.trim()) {
    return { status: "skipped", reason: "recipient-not-allowed" };
  }

  const to = allowedRecipients(uniqueRecipients(message.to), allowlist);
  if (to.length === 0) {
    return { status: "skipped", reason: "recipient-not-allowed" };
  }

  const toEmails = new Set(to.map(({ email }) => email.trim().toLowerCase()));
  const cc = allowedRecipients(
    uniqueRecipients(message.cc ?? []).filter(
      ({ email }) => !toEmails.has(email.trim().toLowerCase()),
    ),
    allowlist,
  );

  const response = await deliverMail(env.BREVO_API_KEY, {
    ...message,
    to,
    cc: cc.length > 0 ? cc : undefined,
  });

  return { status: "sent", messageId: response.messageId };
}
