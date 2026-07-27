import { expect, test } from "vitest";
import {
  TALLY_RECRUITING_TEMPLATE_FORM_ID,
  TALLY_RECRUITING_WORKSPACE_ID,
} from "../../tally/constants";
import { loadTallyFormConfig } from "./config";

test("uses the repository recruiting workspace and template", () => {
  expect(
    loadTallyFormConfig({
      TALLY_WEBHOOK_URL: "https://example.com/webhook",
      TALLY_WEBHOOK_SIGNING_SECRET: "secret",
    }),
  ).toEqual({
    workspaceId: TALLY_RECRUITING_WORKSPACE_ID,
    templateFormId: TALLY_RECRUITING_TEMPLATE_FORM_ID,
    webhookUrl: "https://example.com/webhook",
    webhookSigningSecret: "secret",
  });
});

test("keeps deployed webhooks on the current app environment", () => {
  expect(
    loadTallyFormConfig({
      NEXT_PUBLIC_APP_URL: "https://stage-ybase.youngfounders.network",
      TALLY_WEBHOOK_URL:
        "https://ybase.youngfounders.network/api/webhooks/tally",
      TALLY_WEBHOOK_SIGNING_SECRET: "secret",
    }).webhookUrl,
  ).toBe("https://stage-ybase.youngfounders.network/api/webhooks/tally");
});

test("uses the explicit public webhook for local development", () => {
  expect(
    loadTallyFormConfig({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      TALLY_WEBHOOK_URL:
        "https://stage-ybase.youngfounders.network/api/webhooks/tally",
      TALLY_WEBHOOK_SIGNING_SECRET: "secret",
    }).webhookUrl,
  ).toBe("https://stage-ybase.youngfounders.network/api/webhooks/tally");
});

test("requires the webhook configuration", () => {
  expect(() => loadTallyFormConfig({})).toThrow(
    "Tally-Formularkonfiguration ist unvollständig",
  );
});
