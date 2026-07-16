import path from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

const TEST_EMAIL = "reimbursement@test.com";
const IMAGE_FILE = path.join(__dirname, "files/test-invoice.jpg");
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
  await page.getByRole("button", { name: "Auf diesem Gerät" }).click();
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

async function saveBankDetails(page: Page) {
  await page.getByPlaceholder("Vor- und Nachname").last().fill("Test User");
  await page
    .getByPlaceholder("DE12 3456 7890 0000 0000 00")
    .fill("DE89370400440532013000");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Bankverbindung gespeichert")).toBeVisible();
}

async function expectSubmission(page: Page, successMessage: string) {
  const success = page.getByText(successMessage);
  const failure = page.getByText(/Fehler beim Einreichen|Bitte .*auswählen/);
  await expect(success.or(failure)).toBeVisible();
  if (await failure.isVisible()) {
    throw new Error(await failure.innerText());
  }
}

async function selectRowAction(page: Page, row: Locator, action: string) {
  await row.getByRole("button", { name: "Aktionen anzeigen" }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test.describe("critical reimbursement journeys", () => {
  test.beforeEach(async ({ page }) => {
    await cleanup();
    await page.goto("/login");
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

  test.afterEach(async () => {
    await cleanup();
  });

  test("expense reimbursement can be revised and approved", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Erstattungen" }).click();
    await page.getByRole("button", { name: "Neue Erstattung" }).click();
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
    await page.getByRole("tab", { name: "Auslagenerstattung" }).click();
    await page.getByRole("combobox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Test Projekt" }).click();

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
    await expect(page.getByText("Test Firma").first()).toBeVisible();

    await saveBankDetails(page);
    await addSignature(page);

    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expectSubmission(page, "Erstattung eingereicht");
    await expect(
      page
        .locator("table tbody tr")
        .first()
        .locator(
          '[data-mobile-metadata="project"]:visible, [data-reimbursement-column="project"]:visible',
        )
        .filter({ hasText: /^Test Projekt$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Auslagenerstattung" }),
    ).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();

    const expenseRow = page.locator("table tbody tr").first();
    await selectRowAction(page, expenseRow, "Änderungen anfordern");
    await page
      .getByRole("textbox", { name: "Benötigte Änderungen..." })
      .fill("Bitte Beschreibung präzisieren");
    await page.getByRole("button", { name: "Änderungen anfordern" }).click();

    await expect(expenseRow.getByText("Änderungen angefordert")).toBeVisible();
    await expect(
      page.getByText("Änderung: Bitte Beschreibung präzisieren"),
    ).toHaveCount(0);

    await expenseRow.click();
    await expect(page).toHaveURL(/\/reimbursements\/[^/]+$/);
    await expect(page.getByText("Angeforderte Änderungen:")).toBeVisible();
    await expect(
      page.getByText("Bitte Beschreibung präzisieren"),
    ).toBeVisible();
    const reimbursementId = page.url().split("/").pop();
    await page.goto(`/erstattung/${reimbursementId}`);

    await expect(
      page.getByText("Bitte Beschreibung präzisieren"),
    ).toBeVisible();
    await expect(page.getByText("Test Firma").first()).toBeVisible();
    await page.getByRole("button", { name: "Einreichen" }).click();
    await expect(
      page.getByRole("heading", { name: "Erfolgreich eingereicht" }),
    ).toBeVisible();

    await page.goto("/reimbursements");
    await expect(
      page.locator("table tbody tr").first().getByText("Ausstehend"),
    ).toBeVisible();
    await selectRowAction(
      page,
      page.locator("table tbody tr").first(),
      "Genehmigen",
    );
    await expect(
      page.getByRole("table").getByText("Genehmigt", { exact: true }),
    ).toBeVisible();

    await page.setViewportSize({ width: 730, height: 628 });
    const selectedRow = page.locator("table tbody tr").first();
    await selectedRow
      .getByRole("checkbox", { name: "Antrag auswählen" })
      .check();

    const bulkActions = page.getByRole("group", {
      name: "Aktionen für 1 ausgewählte Erstattung",
    });
    await expect(bulkActions).toBeVisible();
    expect(
      await bulkActions
        .locator(":scope > *")
        .evaluateAll(
          (elements) =>
            new Set(
              elements.map((element) =>
                Math.round(element.getBoundingClientRect().top),
              ),
            ).size,
        ),
    ).toBe(1);
    await expect
      .poll(() =>
        page
          .locator('[data-slot="table-container"]')
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
      )
      .toBe(true);

    const download = page.waitForEvent("download");
    await bulkActions.getByRole("button", { name: "Herunterladen" }).click();
    expect((await download).suggestedFilename()).toMatch(
      /^Erstattungen_.*\.zip$/,
    );

    await selectedRow
      .getByRole("checkbox", { name: "Antrag auswählen" })
      .check();
    await bulkActions.getByRole("button", { name: "Löschen" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Löschen" })
      .click();
    await expect(page.locator("table tbody tr")).toHaveCount(0);
  });

  test("travel reimbursement can be submitted and declined", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Erstattungen" }).click();
    await page.getByRole("button", { name: "Neue Erstattung" }).click();

    await page.getByRole("combobox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Allgemein" }).click();

    const destination = page.getByPlaceholder("z.B. München, Berlin");
    const purpose = page.getByPlaceholder("z.B. Kundentermin, Konferenz");
    await destination.fill("Berlin");
    await purpose.fill("Event");
    await page.getByPlaceholder("TT.MM.JJJJ").first().fill("15.05.2026");
    await page.getByPlaceholder("TT.MM.JJJJ").nth(1).fill("20.05.2026");
    await page.locator('input[type="time"]').first().fill("08:00");
    await page.locator('input[type="time"]').nth(1).fill("18:00");
    await page.getByPlaceholder("TT.MM.JJJJ").nth(1).blur();

    await page.getByRole("button", { name: "PKW" }).click();

    await page.getByRole("spinbutton").first().fill("500");

    await page
      .getByRole("checkbox", {
        name: "Verpflegungsmehraufwand geltend machen",
      })
      .check();
    await page.locator("#fullDay-days").fill("1");

    await expect(page.getByText("PKW500 km × 0,30 €")).toBeVisible();
    await expect(page.getByText("Brutto gesamt178,00 €")).toBeVisible();

    await saveBankDetails(page);
    await addSignature(page);

    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expectSubmission(page, "Reisekostenerstattung eingereicht");
    const travelRow = page.locator("table tbody tr").first();
    await expect(
      travelRow.getByText("Reisekostenerstattung", { exact: true }),
    ).toBeVisible();
    await expect(
      travelRow
        .locator(
          '[data-mobile-metadata="project"]:visible, [data-reimbursement-column="project"]:visible',
        )
        .filter({ hasText: /^Allgemein$/ }),
    ).toBeVisible();
    await expect(page.getByText("Ausstehend")).toBeVisible();

    await selectRowAction(
      page,
      page.locator("table tbody tr").first(),
      "Ablehnen",
    );
    await page
      .getByRole("textbox", { name: "Grund für die Ablehnung..." })
      .fill("Falsche Angaben");
    await page.getByRole("button", { name: "Ablehnen" }).click();

    await expect(
      page.locator("table tbody tr").first().getByText("Abgelehnt"),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Grund: Falsche Angaben")).toHaveCount(0);

    await page.locator("table tbody tr").first().click();
    await expect(page).toHaveURL(/\/reimbursements\/[^/]+$/);
    await expect(page.getByText("Ablehnungsgrund:")).toBeVisible();
    await expect(page.getByText("Falsche Angaben")).toBeVisible();
    await page.goto("/reimbursements");
  });

  test("volunteer allowance can be revised and resubmitted", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Erstattungen" }).click();
    await page.getByRole("button", { name: "Neue Erstattung" }).click();
    await expect(page).toHaveURL(/\/reimbursements\/new$/);
    await page.getByRole("tab", { name: "Ehrenamtspauschale" }).click();
    await expect(
      page.getByRole("heading", { name: "Persönliche Daten" }),
    ).toBeVisible();
    await page.getByRole("combobox", { name: "Projekt suchen..." }).click();
    await page.getByRole("button", { name: "Allgemein" }).click();

    await page.getByPlaceholder("Vor- und Nachname").first().fill("Test User");
    await page.getByPlaceholder("Musterstraße 123").fill("Teststraße 1");
    await page.getByPlaceholder("12345").fill("10115");
    await page.getByPlaceholder("Musterstadt").fill("Berlin");
    await page
      .getByPlaceholder("z.B. Übungsleiter, Jugendarbeit, Vorstandstätigkeit")
      .fill("Vorstandsarbeit");
    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .first()
      .fill("01.01.2026");
    await page
      .getByRole("textbox", { name: "TT.MM.JJJJ" })
      .nth(1)
      .fill("31.01.2026");
    await page.getByPlaceholder("0,00").fill("120");
    await page.getByRole("checkbox").check();
    await saveBankDetails(page);
    await addSignature(page);
    await page
      .getByRole("button", { name: "Zur Genehmigung einreichen" })
      .click();
    await expectSubmission(page, "Ehrenamtspauschale eingereicht");

    const allowanceRow = page
      .locator("table tbody tr")
      .filter({ hasText: "Ehrenamtspauschale" });
    await selectRowAction(page, allowanceRow, "Änderungen anfordern");
    await page
      .getByRole("textbox", { name: "Benötigte Änderungen..." })
      .fill("Bitte Zeitraum prüfen");
    await page.getByRole("button", { name: "Änderungen anfordern" }).click();
    await expect(
      allowanceRow.getByText("Änderungen angefordert"),
    ).toBeVisible();

    await selectRowAction(page, allowanceRow, "Bearbeiten");
    await expect(page).toHaveURL(/\/ehrenamtspauschale\/[^/]+$/);
    await expect(page.getByText("Bitte Zeitraum prüfen")).toBeVisible();
    await expect(page.getByPlaceholder("Musterstraße 123")).toHaveValue(
      "Teststraße 1",
    );
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Einreichen" }).click();
    await expect(
      page.getByRole("heading", { name: "Erfolgreich eingereicht" }),
    ).toBeVisible();

    await page.goto("/reimbursements");
    await expect(
      page
        .locator("table tbody tr")
        .filter({ hasText: "Ehrenamtspauschale" })
        .getByText("Ausstehend"),
    ).toBeVisible();
  });
});
