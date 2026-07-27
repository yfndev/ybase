import { describe, expect, test } from "vitest";
import { emailDomain, normalizeYfnEmail, suggestYfnEmail } from "./yfnEmail";

describe("YFN email helpers", () => {
  test("normalizes and extracts domains", () => {
    expect(normalizeYfnEmail(" Alex@YoungFounders.Network ")).toBe(
      "alex@youngfounders.network",
    );
    expect(emailDomain("alex@youngfounders.network")).toBe(
      "youngfounders.network",
    );
  });

  test("suggests a normalized address from the applicant name", () => {
    expect(suggestYfnEmail("Luca Kammerer", "youngfounders.network")).toBe(
      "luca.kammerer@youngfounders.network",
    );
    expect(suggestYfnEmail("Jörg Groß", "YoungFounders.Network")).toBe(
      "joerg.gross@youngfounders.network",
    );
    expect(suggestYfnEmail("  Élodie van der Berg  ", "example.org")).toBe(
      "elodie.berg@example.org",
    );
  });

  test("leaves the suggestion empty when the name is missing", () => {
    expect(suggestYfnEmail(undefined, "example.org")).toBe("");
  });
});
