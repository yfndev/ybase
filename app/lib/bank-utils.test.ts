import { describe, expect, test } from "vitest";
import { getBankDetailsError } from "./bank-utils";

describe("getBankDetailsError", () => {
  test("requires an account holder and a valid IBAN", () => {
    expect(getBankDetailsError({ accountHolder: "", iban: "", bic: "" })).toBe(
      "Bitte Kontoinhaber eingeben",
    );
    expect(
      getBankDetailsError({ accountHolder: "Max", iban: "", bic: "" }),
    ).toBe("Bitte IBAN eingeben");
  });

  test("accepts normalized bank details without a BIC", () => {
    expect(
      getBankDetailsError({
        accountHolder: "Max Mustermann",
        iban: "de89 3704 0044 0532 0130 00",
      }),
    ).toBeNull();
  });

  test("rejects an invalid optional BIC", () => {
    expect(
      getBankDetailsError({
        accountHolder: "Max Mustermann",
        iban: "DE89370400440532013000",
        bic: "INVALID",
      }),
    ).toBe("Ungültige BIC");
  });
});
