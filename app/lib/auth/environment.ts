type AuthEnvironment = {
  AUTH_DEV_LOGIN?: string;
  IS_TEST?: string;
  NODE_ENV?: string;
};

function isNonProduction(env: AuthEnvironment): boolean {
  return env.NODE_ENV !== "production";
}

export function isDevelopmentLoginEnabled(
  env: AuthEnvironment = process.env,
): boolean {
  return env.AUTH_DEV_LOGIN === "true" && isNonProduction(env);
}

export function isTestMode(env: AuthEnvironment = process.env): boolean {
  return env.IS_TEST === "true" && isNonProduction(env);
}

export function isLocalCredentialsEnabled(
  env: AuthEnvironment = process.env,
): boolean {
  return isDevelopmentLoginEnabled(env) || isTestMode(env);
}
