type AuthEnvironment = {
  IS_TEST?: string;
  NODE_ENV?: string;
};

function isNonProduction(env: AuthEnvironment): boolean {
  return env.NODE_ENV !== "production";
}

export function isTestMode(env: AuthEnvironment = process.env): boolean {
  return env.IS_TEST === "true" && isNonProduction(env);
}
