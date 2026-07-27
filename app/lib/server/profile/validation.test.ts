import { expect, test } from "vitest";
import { PROFILE_IMAGE_MAX_BYTES, validateProfileImage } from "./validation";

test("validates profile images from their bytes", () => {
  expect(validateProfileImage(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe(
    "image/jpeg",
  );
  expect(() =>
    validateProfileImage(new TextEncoder().encode("not an image")),
  ).toThrow("JPEG- oder PNG");
  expect(() =>
    validateProfileImage(new Uint8Array(PROFILE_IMAGE_MAX_BYTES + 1)),
  ).toThrow("maximal 5 MB");
});
