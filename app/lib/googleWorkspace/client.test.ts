import { generateKeyPairSync } from "node:crypto";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("reports domain-wide delegation rejected by Google", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  vi.stubEnv(
    "GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64",
    Buffer.from(
      JSON.stringify({
        client_email: "ybase@example.iam.gserviceaccount.com",
        private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
        token_uri: "https://oauth.example/token",
      }),
    ).toString("base64"),
  );
  vi.stubEnv("GOOGLE_WORKSPACE_ADMIN_EMAIL", "admin@youngfounders.network");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json(
        { error: "unauthorized_client" },
        {
          status: 400,
        },
      ),
    ),
  );

  const { workspaceRequest } = await import("./client");

  await expect(workspaceRequest("users/example")).rejects.toThrow(
    "Google-Workspace-Domaindelegierung ist nicht autorisiert",
  );
});
