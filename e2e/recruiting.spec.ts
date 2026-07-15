import { expect, type Page, test } from "@playwright/test";

const TEST_EMAIL = "recruiting@test.com";
const E2E_PORT = process.env.CI
  ? 3000
  : Number(process.env.CONDUCTOR_PORT ?? 2999) + 1;
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${E2E_PORT}`;

const DEPARTMENT = "Vorstand";
const TEAM = "Öffentlichkeitsarbeit";
const TITLE = "Social Media Manager:in";
const DESCRIPTION = "Wir suchen Unterstützung für unsere Kanäle.";

async function cleanup() {
  await fetch(`${BASE_URL}/api/test/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
}

async function selectOption(page: Page, triggerId: string, option: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: option }).click();
}

test.describe("Ausschreibungen", () => {
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
      timeout: 10_000,
    });
    await page
      .getByRole("textbox", { name: "Wie heißt dein Verein?" })
      .fill("Recruiting Verein");
    await page.getByRole("button", { name: "Loslegen" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 10_000,
    });

    await page.goto("/settings/teams");
    await page.getByRole("button", { name: "Department erstellen" }).click();
    await page.getByLabel("Department-Name*").fill(DEPARTMENT);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Department erstellen" })
      .click();
    await expect(page.getByText("Department erstellt")).toBeVisible();

    await page.getByRole("button", { name: "Team erstellen" }).click();
    await page.getByLabel("Team-Name*").fill(TEAM);
    await selectOption(page, "team-department", DEPARTMENT);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Team erstellen" })
      .click();
    await expect(page.getByText("Team erstellt")).toBeVisible();
  });

  test.afterAll(async () => {
    await cleanup();
    await page.close();
  });

  test("create a draft, edit rich text and persist it", async () => {
    await page.goto("/recruiting");
    const createButton = page.getByRole("button", {
      name: "Neue Ausschreibung",
    });
    await expect(createButton).toHaveCount(1);
    await createButton.click();
    await page.getByLabel("Titel*").fill(TITLE);
    await selectOption(page, "posting-team", TEAM);
    await page.getByRole("button", { name: "Entwurf erstellen" }).click();

    await expect(page).toHaveURL(/\/recruiting\/[^/]+$/);
    await expect(page.getByText(DEPARTMENT)).toBeVisible();

    const description = page.locator('[aria-label="Beschreibung"]');
    await description.click();
    await page.keyboard.type(DESCRIPTION);
    await page.getByLabel("Ort").fill("Berlin");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Ausschreibung gespeichert")).toBeVisible();

    await page.reload();
    await expect(page.locator('[aria-label="Beschreibung"]')).toContainText(
      DESCRIPTION,
    );
    await expect(page.getByLabel("Ort")).toHaveValue("Berlin");
  });

  test("publish, close and reopen with the status actions", async () => {
    await page.getByRole("button", { name: "Veröffentlichen" }).click();
    await expect(page.getByText("Ausschreibung veröffentlicht")).toBeVisible();
    await expect(
      page.getByText("Veröffentlicht", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Schließen" }).click();
    await expect(page.getByText("Ausschreibung geschlossen")).toBeVisible();
    await expect(page.getByText("Geschlossen", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Wieder öffnen" }).click();
    await expect(page.getByText("Ausschreibung wieder geöffnet")).toBeVisible();
    await expect(
      page.getByText("Veröffentlicht", { exact: true }),
    ).toBeVisible();

    await page.goto("/recruiting");
    const row = page.getByRole("row", { name: new RegExp(TITLE) });
    await expect(row).toContainText("Veröffentlicht");
    await expect(row).toContainText(TEAM);
    await expect(row).toContainText(DEPARTMENT);
  });
});
