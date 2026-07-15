import { after } from "next/server";
import { ingestTallySubmission } from "@/lib/server/applications/ingest";
import { tallyWebhookSchema } from "@/lib/server/applications/tallyPayload";
import { sendApplicationEmails } from "@/lib/server/applications/email";
import { importApplicationFiles } from "@/lib/server/applications/fileImport";
import { loadTallyWebhookSecret } from "@/lib/server/tally/config";
import { verifyTallySignature } from "@/lib/server/tally/signature";

export const runtime = "nodejs";

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("tally-signature");

  let secret: string;
  try {
    secret = loadTallyWebhookSecret();
  } catch {
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyTallySignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = tallyWebhookSchema.safeParse(safeJsonParse(rawBody));
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (parsed.data.eventType !== "FORM_RESPONSE") {
    return Response.json({ ok: true, status: "ignored" });
  }

  let outcome: Awaited<ReturnType<typeof ingestTallySubmission>>;
  try {
    outcome = await ingestTallySubmission(parsed.data);
  } catch {
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  if (outcome.status === "created") {
    const { applicationId, withdrawalToken } = outcome;
    after(async () => {
      await Promise.all([
        sendApplicationEmails(applicationId, withdrawalToken),
        importApplicationFiles(applicationId),
      ]);
    });
  }

  return Response.json({ ok: true, status: outcome.status });
}
