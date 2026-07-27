import { afterEach, expect, test, vi } from "vitest";
import { getGooglePhotoIsDefault } from "./googlePeople";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("detects a custom primary Google profile photo", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        photos: [
          { default: true },
          { default: false, metadata: { primary: true } },
        ],
      }),
    ),
  );

  await expect(getGooglePhotoIsDefault("access-token")).resolves.toBe(false);
});

test("treats a missing Google photo as the default avatar", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ photos: [] })),
  );

  await expect(getGooglePhotoIsDefault("access-token")).resolves.toBe(true);
});

test("returns unknown when Google People cannot be queried", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 503 })),
  );

  await expect(
    getGooglePhotoIsDefault("access-token"),
  ).resolves.toBeUndefined();
  await expect(getGooglePhotoIsDefault(undefined)).resolves.toBeUndefined();
});
