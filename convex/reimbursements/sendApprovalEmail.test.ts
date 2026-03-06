import { expect, test } from "vitest";
import { getFileExtension } from "./sendApprovalEmail";

test("getFileExtension returns pdf for pdf content type", () => {
  expect(getFileExtension("application/pdf")).toBe("pdf");
});

test("getFileExtension returns png for png content type", () => {
  expect(getFileExtension("image/png")).toBe("png");
});

test("getFileExtension returns jpg for jpeg content type", () => {
  expect(getFileExtension("image/jpeg")).toBe("jpg");
});

test("getFileExtension returns jpg for jpg content type", () => {
  expect(getFileExtension("image/jpg")).toBe("jpg");
});

test("getFileExtension returns pdf for unknown content type", () => {
  expect(getFileExtension("application/octet-stream")).toBe("pdf");
});
