import { generateKeyPairSync } from "node:crypto";
import { afterEach, expect, test, vi } from "vitest";
import { updateGoogleWorkspacePhoto } from "./googleWorkspace";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("authenticates the service account directly and updates the user photo", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const tokenUri = "https://oauth.example/token";
  const encodedCredentials = Buffer.from(
    JSON.stringify({
      client_email: "profile-sync@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
      token_uri: tokenUri,
    }),
  ).toString("base64");
  vi.stubEnv(
    "GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64",
    encodedCredentials,
  );

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ access_token: "workspace-token", expires_in: 3600 }),
    )
    .mockResolvedValueOnce(Response.json({}));
  vi.stubGlobal("fetch", fetchMock);

  await updateGoogleWorkspacePhoto(
    "ada@youngfounders.network",
    new Uint8Array([0xff, 0xd8, 0xff]),
  );

  const tokenRequest = fetchMock.mock.calls[0];
  expect(tokenRequest?.[0]).toBe(tokenUri);
  const tokenBody = tokenRequest?.[1]?.body as URLSearchParams;
  const assertion = tokenBody.get("assertion");
  const payload = JSON.parse(
    Buffer.from(assertion?.split(".")[1] ?? "", "base64url").toString(),
  );
  expect(payload).toMatchObject({
    iss: "profile-sync@example.iam.gserviceaccount.com",
    scope: "https://www.googleapis.com/auth/admin.directory.user",
  });
  expect(payload).not.toHaveProperty("sub");

  const photoRequest = fetchMock.mock.calls[1];
  expect(photoRequest?.[0]).toContain(
    "/users/ada%40youngfounders.network/photos/thumbnail",
  );
  expect(photoRequest?.[1]).toMatchObject({
    method: "PUT",
    headers: {
      Authorization: "Bearer workspace-token",
      "Content-Type": "application/json",
    },
  });
  expect(JSON.parse(String(photoRequest?.[1]?.body))).toEqual({
    photoData: "_9j_",
  });
});
