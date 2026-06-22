import { expect, test, type Page } from "@playwright/test";
import path from "path";

const TEST_EMAIL = "reimbursement@test.com";
const IMAGE_FILE = path.join(__dirname, "files/test-invoice.jpg");
const PDF_FILE = path.join(__dirname, "files/test-invoice.pdf");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function cleanup() {
  await fetch(`${BASE_URL}/api/test/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
}

test.describe.serial("reimbursement flow", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await cleanup();
    page = await browser.newPage();
    await page.context().clearCookies();
    await page.goto("/test-auth");
    await page.evaluate(() => localStorage.clear());
    await page.getByTestId("test-auth-email").fill(TEST_EMAIL);
    await page.getByTestId("test-auth-submit").click();

    await expect(page.getByText("Wie heißt dein Verein?")).toBeVisible({
      timeout: 10000,
    });
    await page
      .getByRole("textbox", { name: "Wie heißt dein Verein?" })
      .fill("Test Verein");
    await page.getByRole("button", { name: "Loslegen" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 10000,
    });
  });

  test.afterAll(async () => {
    await cleanup();
    await page.close();
  });

  test("1. Create expense reimbursement with JPG receipt", async () => {
    await page.getByRole("link", { name: "Erstattungen" }).click();
    await page.getByRole("button", { name: "Neue Erstattung" }).click();

    await page.getByRole("textbox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Neues Projekt erstellen" }).click();
    await page
      .getByRole("textbox", { name: "Projektname*" })
      .fill("Test Projekt");
    await page.getByRole("button", { name: "Projekt erstellen" }).click();
    await expect(page.getByText("Projekt erstellt!")).toBeVisible();

    await page
      .getByRole("textbox", { name: "z.B. Amazon, Deutsche Bahn" })
      .fill("Test Firma");
    await page.getByRole("textbox", { name: "z.B. INV-2024-" }).fill("01");
    await page
      .getByRole("textbox", { name: "z.B. Büromaterial für Q1" })
      .fill("Beschreibung");
    await page.getByRole("textbox", { name: "TT.MM.JJJJ" }).fill("01.01.2025");
    await page.getByPlaceholder("119,95").fill("100");

    await page.locator('input[type="file"]').setInputFiles(IMAGE_FILE);
    await expect(page.getByText("Beleg hochgeladen")).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Beleg hinzufügen" }).click();
    await expect(page.getByText("Test Firma")).toBeVisible();

    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expect(page.getByText("Erstattung eingereicht")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Test Projekt" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Auslagenerstattung" }),
    ).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();
  });

  test("2. Mark expense reimbursement as paid", async () => {
    await page
      .locator("table tbody tr")
      .first()
      .locator("button")
      .first()
      .click();
    await expect(page.getByText("Als bezahlt markiert")).toBeVisible();
    await expect(page.getByText("Genehmigt", { exact: true })).toBeVisible();
  });

  test("3. Create travel reimbursement with PDF receipt", async () => {
    await page.getByRole("button", { name: "Neue Erstattung" }).click();
    await page.getByRole("tab", { name: "Reisekostenerstattung" }).click();

    await page.getByRole("textbox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Test Projekt" }).click();

    await page
      .getByRole("textbox", { name: "z.B. München, Berlin" })
      .fill("Berlin");
    await page
      .getByRole("textbox", { name: "z.B. Kundentermin, Konferenz" })
      .fill("Event");
    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .first()
      .fill("01.01.2025");
    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .nth(1)
      .fill("02.01.2025");
    await page.getByRole("textbox", { name: "TT.MM.JJJJ" }).nth(1).blur();

    await page.getByRole("button", { name: "PKW" }).click();

    await page.getByPlaceholder("Eigenfahrt, Miles, Sixt, etc.").fill("Miles");
    await page.getByRole("spinbutton").first().fill("500");

    await page.locator('input[type="file"]').setInputFiles(PDF_FILE);
    await expect(page.getByText("Beleg hochgeladen")).toBeVisible({
      timeout: 10000,
    });

    await page.getByPlaceholder("z.B. 2.5").fill("1.5");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "28 € (24h+)" }).click();

    await expect(page.getByText("PKW500 km × 0,30€")).toBeVisible();
    await expect(page.getByText("Gesamt192.00 €")).toBeVisible();

    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expect(page.getByText("Erstattung eingereicht")).toBeVisible();
    await expect(page.getByText("ReisekostenerstattungBerlin")).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();
  });

  test("4. Reject travel reimbursement", async () => {
    await page
      .locator("table tbody tr")
      .first()
      .locator("button")
      .nth(1)
      .click();
    await page
      .getByRole("textbox", { name: "Grund für die Ablehnung..." })
      .fill("Falsche Angaben");
    await page.getByRole("button", { name: "Ablehnen" }).click();

    await expect(page.getByText("Ablehnung: Falsche Angaben")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator("table tbody tr").first().getByText("Abgelehnt"),
    ).toBeVisible();
  });

});
