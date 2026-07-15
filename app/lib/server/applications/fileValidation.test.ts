import { expect, test } from "vitest";
import {
  contentTypesMatch,
  detectApplicationFileType,
  safeStorageFileName,
} from "./fileValidation";

test("detects allowed file signatures", () => {
  expect(
    detectApplicationFileType(new TextEncoder().encode("%PDF-1.7 document")),
  ).toBe("application/pdf");
  expect(
    detectApplicationFileType(
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
  ).toBe("image/png");
  expect(detectApplicationFileType(Uint8Array.from([0xff, 0xd8, 0xff]))).toBe(
    "image/jpeg",
  );
});

test("rejects unknown contents and treats HEIC and HEIF as compatible", () => {
  expect(detectApplicationFileType(new TextEncoder().encode("script"))).toBe(
    undefined,
  );
  expect(contentTypesMatch("image/heic", "image/heif")).toBe(true);
});

test("creates a storage-safe file name", () => {
  expect(safeStorageFileName("../../Mein Lebenslauf (final).pdf")).toBe(
    "..-..-Mein-Lebenslauf-final-.pdf",
  );
});
