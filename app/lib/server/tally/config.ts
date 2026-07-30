import {
  TALLY_RECRUITING_FALLBACK_TEMPLATE_FORM_ID,
  TALLY_RECRUITING_WORKSPACE_ID,
} from "../../tally/constants";

type TallyEnvironment = {
  [key: string]: string | undefined;
};

export interface TallyFormConfig {
  workspaceId: string;
  templateFormId: string;
  webhookUrl: string;
  webhookSigningSecret: string;
}

function deployedWebhookUrl(env: TallyEnvironment): string | undefined {
  const configuredAppUrl = (env.NEXT_PUBLIC_APP_URL ?? env.AUTH_URL)?.trim();
  if (!configuredAppUrl) return undefined;

  try {
    const appUrl = new URL(configuredAppUrl);
    if (
      appUrl.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "::1"].includes(appUrl.hostname)
    ) {
      return undefined;
    }
    return new URL("/api/webhooks/tally", appUrl).toString();
  } catch {
    return undefined;
  }
}

export function loadTallyFormConfig(
  env: TallyEnvironment = process.env,
): TallyFormConfig {
  const webhookUrl = deployedWebhookUrl(env) ?? env.TALLY_WEBHOOK_URL?.trim();
  const webhookSigningSecret = env.TALLY_WEBHOOK_SIGNING_SECRET?.trim();
  if (!webhookUrl || !webhookSigningSecret) {
    throw new Error("Tally-Formularkonfiguration ist unvollständig");
  }
  return {
    workspaceId: TALLY_RECRUITING_WORKSPACE_ID,
    templateFormId: TALLY_RECRUITING_FALLBACK_TEMPLATE_FORM_ID,
    webhookUrl,
    webhookSigningSecret,
  };
}

export function loadTallyWebhookSecret(
  env: TallyEnvironment = process.env,
): string {
  const secret = env.TALLY_WEBHOOK_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("TALLY_WEBHOOK_SIGNING_SECRET ist nicht konfiguriert");
  }
  return secret;
}
