import { createSign } from "node:crypto";

const DIRECTORY_SCOPE = "https://www.googleapis.com/auth/admin.directory.user";
const DIRECTORY_URL = "https://admin.googleapis.com/admin/directory/v1";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let cachedToken: { accessToken: string; expiresAt: number } | undefined;

export class WorkspaceApiError extends Error {
  constructor(public readonly status: number) {
    super("Google Workspace request failed");
  }
}

function encode(value: string | Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

function credentials(): ServiceAccountCredentials {
  const encoded =
    process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encoded) {
    throw new Error("Google-Workspace-Integration ist nicht konfiguriert");
  }

  try {
    const value = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf8"),
    ) as Partial<ServiceAccountCredentials>;
    if (!value.client_email || !value.private_key) throw new Error();
    return {
      client_email: value.client_email,
      private_key: value.private_key,
      token_uri: value.token_uri,
    };
  } catch {
    throw new Error("Google-Workspace-Konfiguration ist ungültig");
  }
}

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const account = credentials();
  const tokenUri = account.token_uri ?? "https://oauth2.googleapis.com/token";
  const issuedAt = Math.floor(Date.now() / 1_000);
  const header = encode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({
      iss: account.client_email,
      scope: DIRECTORY_SCOPE,
      aud: tokenUri,
      iat: issuedAt,
      exp: issuedAt + 3_600,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const assertion = `${unsignedToken}.${encode(
    signer.sign(account.private_key),
  )}`;

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error("Google-Workspace-Authentifizierung fehlgeschlagen");
  }
  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error("Google hat kein Zugriffstoken zurückgegeben");
  }
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3_600) * 1_000,
  };
  return data.access_token;
}

export async function workspaceRequest<T>(
  path: string,
  init: { method?: string; data?: unknown } = {},
): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`${DIRECTORY_URL}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.data ? { "Content-Type": "application/json" } : {}),
    },
    ...(init.data ? { body: JSON.stringify(init.data) } : {}),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new WorkspaceApiError(response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
