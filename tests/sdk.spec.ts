import { exec } from "child_process";
import util from "util";
import { expect, test } from "@playwright/test";

import type { Page } from "@playwright/test";

const execPromise = util.promisify(exec);

const platformId = process.env.TEST_PLATFORM_ID;
const organizationTaxId = process.env.TEST_ORGANIZATION_TAX_ID;

if (!platformId || !organizationTaxId) {
  throw new Error(
    "`TEST_PLATFORM_ID` and `TEST_ORGANIZATION_TAX_ID` must be set",
  );
}

type FormData = {
  platformId: string;
  organizationTaxId: string;
  amount: string;
  email?: string;
  schedule?: {
    intervalType: string;
    intervalCount: number;
    startDate?: string;
    endDate?: string;
    totalPayments?: number;
  };
};

async function fillForm(
  page: Page,
  { platformId, organizationTaxId, amount, email, schedule }: FormData,
) {
  await page.fill("#platformId", platformId);
  await page.fill("#organizationTaxId", organizationTaxId);
  await page.fill("#amount", amount);
  if (email) await page.fill("#email", email);

  if (schedule) {
    await page.check("#enableRecurring");
    const recurringOptions = page.locator("#recurringOptions");
    await expect(recurringOptions).toBeVisible();
    await expect(recurringOptions).toBeVisible();
    await page.selectOption("#intervalType", schedule.intervalType);
    await page.fill("#intervalCount", schedule.intervalCount.toString());
    if (schedule.startDate) await page.fill("#startDate", schedule.startDate);
    if (schedule.endDate) await page.fill("#endDate", schedule.endDate);
    if (schedule.totalPayments)
      await page.fill("#totalPayments", schedule.totalPayments.toString());
  }
}

async function testSimpleBubbleInjected(page: Page, shouldBeVisible: boolean) {
  const simpleBubble = page.locator('div[title="Pay with Simple"]');
  if (shouldBeVisible) {
    await expect(simpleBubble).toBeVisible();
    // Check if the SVG is a child of the Simple bubble
    const svg = simpleBubble.locator("svg");
    await expect(svg).toBeVisible();
  } else {
    await expect(simpleBubble).not.toBeVisible();
  }
}

test.describe("Simple bubble injects properly", async () => {
  let consoleMessages: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}]: ${msg.text()}`);
    });
  });

  // eslint-disable-next-line no-empty-pattern
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== "passed") {
      console.log("Browser console messages for failed test:");
      consoleMessages.forEach((msg) => console.log(msg));
    }
  });

  // Build the SDK before each test
  test.beforeEach(() => execPromise("bun run build"));

  test("Should inject Simple bubble", async ({ page }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "100",
    });

    await testSimpleBubbleInjected(page, true);
  });

  test("Should inject Simple bubble / also with invalid email", async ({
    page,
  }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "100",
      email: "invalid",
    });

    await testSimpleBubbleInjected(page, true);
  });

  test("Should not inject Simple bubble / invalid platformId", async ({
    page,
  }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId: "invalid",
      organizationTaxId,
      amount: "100",
      email: "test@example.com",
    });

    await testSimpleBubbleInjected(page, false);
  });

  test("Should not inject Simple bubble / invalid organizationTaxId", async ({
    page,
  }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId: "invalid",
      amount: "100",
      email: "test@example.com",
    });

    await testSimpleBubbleInjected(page, false);
  });

  test("Should not inject Simple bubble / invalid amount", async ({ page }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "-100",
      email: "test@example.com",
    });

    await testSimpleBubbleInjected(page, false);
  });

  test("Should inject Simple bubble, w/ schedule", async ({ page }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "100",
      email: "test@example.com",
      schedule: {
        intervalType: "month",
        intervalCount: 3,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        totalPayments: 12,
      },
    });

    await testSimpleBubbleInjected(page, true);
  });

  test("Should not inject Simple bubble / invalid interval type", async ({
    page,
  }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "100",
      email: "test@example.com",
      schedule: {
        intervalType: "",
        intervalCount: 1,
      },
    });

    await testSimpleBubbleInjected(page, false);
  });

  test("Should not inject Simple bubble / invalid interval count", async ({
    page,
  }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "100",
      email: "test@example.com",
      schedule: {
        intervalType: "month",
        intervalCount: -1,
      },
    });

    await testSimpleBubbleInjected(page, false);
  });

  test("Should not inject Simple bubble / invalid total payments", async ({
    page,
  }) => {
    await page.goto("http://localhost:8000");
    await fillForm(page, {
      platformId,
      organizationTaxId,
      amount: "100",
      email: "test@example.com",
      schedule: {
        intervalType: "month",
        intervalCount: 3,
        totalPayments: -1,
      },
    });

    await testSimpleBubbleInjected(page, false);
  });
});
