import { expect, test, vi } from "vitest";
import type { ApplicationFile } from "../../db/types";
import { downloadApplicationFile } from "./fileDownload";
import { APPLICATION_FILE_MAX_BYTES } from "./fileValidation";

function applicationFile(
  overrides: Partial<ApplicationFile> = {},
): ApplicationFile {
  return {
    _id: "file-1",
    fieldKey: "cv",
    fieldLabel: "Lebenslauf",
    sourceUrl: "https://storage.tally.so/private/cv.pdf?token=secret",
    fileName: "cv.pdf",
    mimeType: "application/pdf",
    size: 20,
    status: "pending",
    attempts: 0,
    updatedAt: Date.now(),
    ...overrides,
  };
}

test("rejects unsupported types before downloading", async () => {
  const fetcher = vi.fn() as unknown as typeof fetch;

  await expect(
    downloadApplicationFile(
      applicationFile({ mimeType: "application/msword" }),
      fetcher,
    ),
  ).rejects.toThrow("Dieser Dateityp ist nicht erlaubt.");
  expect(fetcher).not.toHaveBeenCalled();
});

test("rejects oversized files before downloading", async () => {
  const fetcher = vi.fn() as unknown as typeof fetch;

  await expect(
    downloadApplicationFile(
      applicationFile({ size: APPLICATION_FILE_MAX_BYTES + 1 }),
      fetcher,
    ),
  ).rejects.toThrow("Die Datei ist zu groß.");
  expect(fetcher).not.toHaveBeenCalled();
});

test("rejects content that does not match the declared type", async () => {
  const response = new Response("not a pdf", {
    headers: { "content-type": "application/octet-stream" },
  });
  const fetcher = vi.fn(async () => response) as unknown as typeof fetch;

  await expect(
    downloadApplicationFile(applicationFile(), fetcher),
  ).rejects.toThrow("Der Dateiinhalt ist nicht erlaubt.");
});
