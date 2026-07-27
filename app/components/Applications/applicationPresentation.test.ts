import { expect, test } from "vitest";
import {
  formatFieldLabel,
  formatFieldValue,
  isApplicantIdentityField,
} from "./applicationPresentation";

test("formats Tally dates, times, booleans, rankings, and matrices", () => {
  expect(formatFieldValue("2026-07-26", "INPUT_DATE")).toBe("26.07.2026");
  expect(formatFieldValue("12:30", "INPUT_TIME")).toBe("12:30 Uhr");
  expect(formatFieldValue(true, "CHECKBOXES")).toBe("Ja");
  expect(formatFieldValue(["Wirkung", "Lernen"], "RANKING")).toBe(
    "1. Wirkung · 2. Lernen",
  );
  expect(formatFieldValue({ Montag: ["Morgens", "Abends"] }, "MATRIX")).toBe(
    "Montag: Morgens, Abends",
  );
});

test("suppresses identity fields already shown in the application details", () => {
  expect(
    isApplicantIdentityField({
      key: "email",
      label: "E-Mail",
      type: "INPUT_EMAIL",
      value: "max@example.com",
    }),
  ).toBe(true);
  expect(
    isApplicantIdentityField({
      key: "full-name",
      label: "Vor- und Nachname:",
      type: "INPUT_TEXT",
      value: "Max Mustermann",
    }),
  ).toBe(true);
  expect(
    isApplicantIdentityField({
      key: "phone",
      label: "Telefon",
      type: "INPUT_PHONE_NUMBER",
      value: "+491234",
    }),
  ).toBe(true);
});

test("decodes HTML entities in Tally field labels", () => {
  expect(
    formatFieldLabel(
      "Wenn du beim YFN&nbsp;eine Sache &amp; mehr verändern dürftest",
    ),
  ).toBe("Wenn du beim YFN eine Sache & mehr verändern dürftest");
  expect(formatFieldLabel("Größe &#62; 10")).toBe("Größe > 10");
});
