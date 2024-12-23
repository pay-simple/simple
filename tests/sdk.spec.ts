import { expect, test } from "@playwright/test";

const platformId = process.env.TEST_PLATFORM_ID;
const organizationTaxId = process.env.TEST_ORGANIZATION_TAX_ID;

if (!platformId || !organizationTaxId) {
  throw new Error(
    "`TEST_PLATFORM_ID` and `TEST_ORGANIZATION_TAX_ID` must be set",
  );
}

test.describe("Simple bubble injects properly", async () => {
  test("Test Localhost", async ({ page }) => {
    await page.goto("http://localhost:8000");

    await page.fill("#platformId", platformId);
    await page.fill("#organizationTaxId", organizationTaxId);
    await page.fill("#amount", "100");
    await page.fill("#email", "test@example.com");

    // Check if the Simple bubble is present
    const simpleBubble = page.locator('div[title="Pay with Simple"]');
    await expect(simpleBubble).toBeVisible();

    // Check if the SVG is a child of the Simple bubble
    const svg = simpleBubble.locator("svg");
    await expect(svg).toBeVisible();
  });
});
