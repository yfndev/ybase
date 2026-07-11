import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

const TEST_EMAIL = "reimbursement@test.com";
const IMAGE_FILE = path.join(__dirname, "files/test-invoice.jpg");
const PDF_FILE = path.join(__dirname, "files/test-invoice.pdf");
const E2E_PORT = process.env.CI
  ? 3000
  : Number(process.env.CONDUCTOR_PORT ?? 2999) + 1;
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${E2E_PORT}`;

async function cleanup() {
  await fetch(`${BASE_URL}/api/test/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
}

async function addSignature(page: Page) {
  await page.getByRole("button", { name: "Am Computer" }).click();
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Signature canvas is not visible");

  await page.mouse.move(box.x + 20, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 80, { steps: 5 });
  await page.mouse.move(box.x + 140, box.y + 30, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Unterschrift speichern" }).click();
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Unterschrift gespeichert" }),
  ).toBeVisible();
}

test.describe.serial("reimbursement flow", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await cleanup();
    page = await browser.newPage();
    await page.context().clearCookies();
    await page.goto("/login");
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
    const reimbursementTabs = page.getByRole("tab");
    await expect(reimbursementTabs).toHaveCount(3);
    expect(await reimbursementTabs.allTextContents()).toEqual([
      "Reisekostenerstattung",
      "Auslagenerstattung",
      "Ehrenamtspauschale",
    ]);
    await expect(
      page.getByRole("tab", { name: "Reisekostenerstattung" }),
    ).toHaveAttribute("data-state", "active");
    await page.getByRole("tab", { name: "Auslagenerstattung" }).click();

    await page.getByRole("textbox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Neues Projekt erstellen" }).click();
    await page
      .getByRole("textbox", { name: "Projektname*" })
      .fill("Test Projekt");
    await page.getByRole("button", { name: "Projekt erstellen" }).click();
    await expect(page.getByText("Projekt erstellt")).toBeVisible();

    await page
      .getByRole("textbox", {
        name: "z.B. Amazon GmbH, Deutsche Bahn AG",
      })
      .fill("Test Firma");
    await page
      .getByRole("textbox", { name: "z.B. INV-2024-001 (optional)" })
      .fill("01");
    await page
      .getByRole("textbox", { name: "z.B. Büromaterial für Q1" })
      .fill("Beschreibung");
    await page.getByRole("textbox", { name: "TT.MM.JJJJ" }).fill("01.01.2025");
    await page.getByPlaceholder("119,95").fill("100");

    await page.locator('input[type="file"]').setInputFiles(IMAGE_FILE);
    await expect(page.getByText("Beleg hochgeladen")).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Beleg speichern" }).click();
    await expect(page.getByText("Test Firma")).toBeVisible();

    await addSignature(page);

    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expect(page.getByText("Erstattung eingereicht")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Test Projekt", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Auslagenerstattung" }),
    ).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();
  });

  test("2. Approve expense reimbursement", async () => {
    await page
      .locator("table tbody tr")
      .first()
      .getByRole("button", { name: "Genehmigen" })
      .click();
    await expect(
      page.getByRole("table").getByText("Genehmigt", { exact: true }),
    ).toBeVisible();
  });

  test("3. Create travel reimbursement with PDF receipt", async () => {
    await page.getByRole("button", { name: "Neue Erstattung" }).click();

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

    await page
      .getByRole("checkbox", {
        name: "Verpflegungsmehraufwand geltend machen",
      })
      .check();
    await page.getByPlaceholder("z.B. 2.5").fill("1.5");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "28 € (24h+)" }).click();

    await expect(page.getByText("PKW500 km × 0,30 €")).toBeVisible();
    await expect(page.getByText("Brutto gesamt192,00 €")).toBeVisible();

    await addSignature(page);

    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expect(
      page.getByText("Reisekostenerstattung eingereicht"),
    ).toBeVisible();
    await expect(
      page.getByText("Reisekostenerstattung - Berlin"),
    ).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();
  });

  test("4. Reject travel reimbursement", async () => {
    await page
      .locator("table tbody tr")
      .first()
      .getByRole("button", { name: "Ablehnen" })
      .click();
    await page
      .getByRole("textbox", { name: "Grund für die Ablehnung..." })
      .fill("Falsche Angaben");
    await page.getByRole("button", { name: "Ablehnen" }).click();

    await expect(page.getByText("Ablehnungsgrund: Falsche Angaben")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator("table tbody tr").first().getByText("Abgelehnt"),
    ).toBeVisible();
  });
});
