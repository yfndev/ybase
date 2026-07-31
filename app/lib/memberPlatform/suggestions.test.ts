import { describe, expect, test } from "vitest";
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  suggestMemberPlatformProfile,
} from "./suggestions";

const profile = {
  id: "member-1",
  person: { firstName: "Zoë", lastName: "Beispiel" },
  contact: { email: "zoe@example.com", phone: "+49 170 1234567" },
  auth: { provider: "google", providerId: "google-1" },
};

describe("member platform profile suggestions", () => {
  test("normalizes identifiers used for suggestions", () => {
    expect(normalizeEmail(" Zoe@Example.COM ")).toBe("zoe@example.com");
    expect(normalizePhone("0049 (170) 123-4567")).toBe("491701234567");
    expect(normalizeName(" Zoë  Beispiel ")).toBe("zoe beispiel");
  });

  test("suggests the profile with the strongest identity evidence", () => {
    const suggestion = suggestMemberPlatformProfile({
      member: {
        name: "Zoe Beispiel",
        privateEmail: "zoe@example.com",
      },
      profiles: [profile, { ...profile, id: "member-2", contact: undefined }],
    });

    expect(suggestion?.id).toBe("member-1");
  });

  test("can suggest a unique exact name for user confirmation", () => {
    const suggestion = suggestMemberPlatformProfile({
      member: { name: "Zoe Beispiel" },
      profiles: [profile],
    });

    expect(suggestion?.id).toBe("member-1");
  });

  test("does not treat another auth provider as the Workspace identity", () => {
    const suggestion = suggestMemberPlatformProfile({
      member: { googleWorkspaceUserId: "google-1" },
      profiles: [
        { ...profile, auth: { provider: "linkedin", providerId: "google-1" } },
      ],
    });

    expect(suggestion).toBeUndefined();
  });

  test("does not choose between equally strong profiles", () => {
    const suggestion = suggestMemberPlatformProfile({
      member: { privateEmail: "zoe@example.com" },
      profiles: [profile, { ...profile, id: "member-2" }],
    });

    expect(suggestion).toBeUndefined();
  });
});
