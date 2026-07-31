import { headers } from "next/headers";

export async function membershipRequestMetadata() {
  const values = await headers();
  const forwarded = values.get("x-forwarded-for")?.split(",")[0]?.trim();
  const direct = values.get("x-real-ip")?.trim();
  const userAgent = values.get("user-agent")?.slice(0, 500);
  return {
    ...(forwarded || direct ? { ipAddress: forwarded ?? direct } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}
