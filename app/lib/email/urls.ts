type AppUrlEnvironment = {
  [key: string]: string | undefined;
  AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

export function appUrl(
  path: string,
  env: AppUrlEnvironment = process.env,
): string {
  const configuredUrl = env.NEXT_PUBLIC_APP_URL ?? env.AUTH_URL;

  if (!configuredUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required for transactional email links",
    );
  }

  return new URL(path, `${configuredUrl.replace(/\/$/, "")}/`).toString();
}
