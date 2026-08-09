import { describe, expect, test } from "vitest";
import {
  membershipDocumentDirectory,
  membershipExecutionDirectory,
  profileImageUploadDirectory,
  reimbursementUploadDirectory,
} from "./keys";

describe("profileImageUploadDirectory", () => {
  test("builds a user-scoped profile image directory", () => {
    expect(profileImageUploadDirectory("user-123")).toBe(
      "profile-images/user-123",
    );
  });
});

describe("reimbursementUploadDirectory", () => {
  test.each([
    ["expense", "receipt", "reimbursements/expense/org-123/receipts"],
    ["travel", "signature", "reimbursements/travel/org-123/signatures"],
    [
      "volunteer-allowance",
      "signature",
      "reimbursements/volunteer-allowance/org-123/signatures",
    ],
  ] as const)("builds the %s %s directory", (type, documentType, expected) => {
    expect(reimbursementUploadDirectory(type, "org-123", documentType)).toBe(
      expected,
    );
  });

  test("rejects organization IDs that could escape their directory", () => {
    expect(() =>
      reimbursementUploadDirectory("expense", "../other", "receipt"),
    ).toThrow("Invalid organization ID");
  });
});

describe("membership storage directories", () => {
  test("builds organization-scoped document and execution paths", () => {
    expect(membershipDocumentDirectory("org-123", "document-456")).toBe(
      "memberships/org-123/documents/document-456",
    );
    expect(membershipExecutionDirectory("org-123", "execution-789")).toBe(
      "memberships/org-123/executions/execution-789",
    );
  });

  test("rejects IDs that could escape the membership directory", () => {
    expect(() => membershipDocumentDirectory("../other", "document")).toThrow(
      "Invalid organization ID",
    );
    expect(() => membershipExecutionDirectory("org", "../execution")).toThrow(
      "Invalid document execution ID",
    );
  });
});
