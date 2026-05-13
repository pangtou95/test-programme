import { expect, test } from "@playwright/test";
import { readQualityConfig } from "../config";

test.describe("Web Smoke", () => {
  test("@smoke opens the product entrypoint", async ({ page }) => {
    const config = readQualityConfig();
    test.skip(!config.web.enabled, "web target is disabled");

    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    if (config.web.requiredText) {
      await expect(page.locator("body")).toContainText(config.web.requiredText);
    }
  });
});
