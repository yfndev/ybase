import { timingSafeEqual } from "node:crypto";

const MINIMUM_TOKEN_LENGTH = 32;

export function authenticateTeamDirectoryToken(
  token: string,
): string | null {
  const expectedToken =
    process.env.YFN_LANDING_TEAM_DIRECTORY_TOKEN?.trim() ?? "";
  const organizationId =
    process.env.YFN_LANDING_TEAM_DIRECTORY_ORGANIZATION_ID?.trim() ?? "";
  if (
    !organizationId ||
    expectedToken.length < MINIMUM_TOKEN_LENGTH ||
    token.length !== expectedToken.length
  ) {
    return null;
  }

  const actual = Buffer.from(token, "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  if (actual.length !== expected.length) return null;
  return timingSafeEqual(actual, expected) ? organizationId : null;
}
