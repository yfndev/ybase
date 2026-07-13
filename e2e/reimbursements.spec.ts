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

async function drawSignature(page: Page) {
  const canvas = page.locator("canvas:visible").last();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const signatureCanvas = element as HTMLCanvasElement;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        return (
          signatureCanvas.width === signatureCanvas.offsetWidth * ratio &&
          signatureCanvas.height === signatureCanvas.offsetHeight * ratio
        );
      }),
    )
    .toBe(true);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Signature canvas is not visible");

  await page.mouse.move(box.x + 20, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 80, { steps: 5 });
  await page.mouse.move(box.x + 140, box.y + 30, { steps: 5 });
  await page.mouse.up();
}

async function addSignature(page: Page) {
  await page.getByRole("button", { name: "Am Computer" }).click();
  await page.waitForTimeout(100);
  await drawSignature(page);
  await page.getByRole("button", { name: "Unterschrift speichern" }).click();
  const saved = page
    .getByRole("paragraph")
    .filter({ hasText: "Unterschrift gespeichert" });
  const failed = page.getByText(
    /Bitte unterschreiben|Speichern fehlgeschlagen/,
  );
  await expect(saved.or(failed)).toBeVisible({ timeout: 10_000 });
  if (await failed.isVisible()) {
    throw new Error(`Unterschrift fehlgeschlagen: ${await failed.innerText()}`);
  }
  await expect(saved.locator("..").locator(".animate-spin")).toHaveCount(0);
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

    await page.getByRole("combobox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Neues Projekt erstellen" }).click();
    await page
      .getByRole("textbox", { name: "Projektname*" })
      .fill("Test Projekt");
    await page.getByRole("textbox", { name: "Reiseziel" }).fill("Köln");
    await page
      .getByRole("textbox", { name: "Reisezweck" })
      .fill("Team-Wochenende");
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

    const receiptDropzone = page.getByRole("region", {
      name: "Beleg hochladen",
    });
    await expect(receiptDropzone).toHaveCSS("display", "flex");
    await expect(receiptDropzone).toHaveCSS("border-style", "dashed");
    await expect(
      page.getByRole("button", { name: "Datei auswählen" }),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(IMAGE_FILE);
    await expect(page.getByText("Beleg hochgeladen")).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Beleg speichern" }).click();
    await expect(page.getByText("Test Firma")).toBeVisible();

    await page.getByPlaceholder("Vor- und Nachname").fill("Test User");
    await page
      .getByPlaceholder("DE12 3456 7890 0000 0000 00")
      .fill("DE89370400440532013000");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Bankverbindung gespeichert")).toBeVisible();

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

    await page.getByRole("combobox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Test Projekt" }).click();

    const destination = page.getByRole("textbox", {
      name: "z.B. München, Berlin",
    });
    const purpose = page.getByRole("textbox", {
      name: "z.B. Kundentermin, Konferenz",
    });
    await expect(destination).toHaveValue("Köln");
    await expect(purpose).toHaveValue("Team-Wochenende");
    await destination.fill("Berlin");
    await purpose.fill("Event");
    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .first()
      .fill("15.05.2026");
    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .nth(1)
      .fill("20.05.2025");
    await page.getByRole("textbox", { name: "TT.MM.JJJJ" }).nth(1).blur();
    await expect(
      page.getByText(
        "Das Reiseende muss am oder nach dem Reisebeginn liegen. Korrigiere das Datum, um die Kostenarten anzuzeigen.",
      ),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .nth(1)
      .fill("20.05.2026");
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
    await page.getByRole("combobox").filter({ hasText: "Auswählen" }).click();
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
    const travelRow = page.locator("table tbody tr").first();
    await expect(
      travelRow.getByText("Reisekostenerstattung", { exact: true }),
    ).toBeVisible();
    await expect(
      travelRow.getByText("Test Projekt", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();
  });

  test("4. Filter reimbursements by type", async () => {
    const tableRows = page.locator("table tbody tr");

    await expect(tableRows).toHaveCount(2);
    await tableRows
      .first()
      .getByRole("checkbox", { name: "Antrag auswählen" })
      .check();
    await expect(
      page.getByRole("button", { name: "1 herunterladen" }),
    ).toBeVisible();

    await page
      .getByRole("tab", { name: "Reisekostenerstattung", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "1 herunterladen" }),
    ).not.toBeVisible();
    await expect(tableRows).toHaveCount(1);
    await expect(
      page.getByRole("cell", { name: "Reisekostenerstattung" }),
    ).toBeVisible();

    await page
      .getByRole("tab", { name: "Auslagenerstattung", exact: true })
      .click();
    await expect(tableRows).toHaveCount(1);
    await expect(
      page.getByRole("cell", { name: "Auslagenerstattung" }),
    ).toBeVisible();

    await page
      .getByRole("tab", { name: "Ehrenamtspauschale", exact: true })
      .click();
    await expect(page.getByText("Keine Erstattungen gefunden.")).toBeVisible();

    await page.getByRole("tab", { name: "Alle", exact: true }).click();
    await expect(tableRows).toHaveCount(2);
  });

  test("5. Reject travel reimbursement", async () => {
    await page
      .locator("table tbody tr")
      .first()
      .getByRole("button", { name: "Ablehnen" })
      .click();
    await page
      .getByRole("textbox", { name: "Grund für die Ablehnung..." })
      .fill("Falsche Angaben");
    await page.getByRole("button", { name: "Ablehnen" }).click();

    await expect(page.getByText("Grund: Falsche Angaben")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator("table tbody tr").first().getByText("Abgelehnt"),
    ).toBeVisible();
  });
});
