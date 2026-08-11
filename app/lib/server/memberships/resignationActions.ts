"use server";

import { requestOwnMembershipResignation } from "./selfServiceResignation";

export async function declareOwnMembershipResignation() {
  return requestOwnMembershipResignation();
}
