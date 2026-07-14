type TallyEnvironment = {
  [key: string]: string | undefined;
};

export interface TallyFormConfig {
  workspaceId: string;
  templateFormId: string;
  webhookUrl: string;
  webhookSigningSecret: string;
}

export function loadTallyFormConfig(
  env: TallyEnvironment = process.env,
): TallyFormConfig {
  const workspaceId = env.TALLY_WORKSPACE_ID?.trim();
  const templateFormId = env.TALLY_TEMPLATE_FORM_ID?.trim();
  const webhookUrl = env.TALLY_WEBHOOK_URL?.trim();
  const webhookSigningSecret = env.TALLY_WEBHOOK_SIGNING_SECRET?.trim();
  if (!workspaceId || !templateFormId || !webhookUrl || !webhookSigningSecret) {
    throw new Error("Tally-Formularkonfiguration ist unvollständig");
  }
  return { workspaceId, templateFormId, webhookUrl, webhookSigningSecret };
}
