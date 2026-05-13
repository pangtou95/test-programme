import { expect, test } from "@playwright/test";
import { readQualityConfig } from "../config";

test.describe("Browser Concurrency", () => {
  test("@performance @concurrency supports multiple independent browser sessions", async ({ browser }, testInfo) => {
    const config = readQualityConfig();
    test.skip(!config.web.enabled, "web target is disabled");

    const sessionCount = process.env.CI ? 3 : 4;
    const baseURL = String(testInfo.project.use.baseURL || config.web.baseURL);
    const results = await Promise.all(
      Array.from({ length: sessionCount }, async (_, index) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const consoleErrors: string[] = [];

        page.on("console", (message) => {
          if (message.type() === "error") {
            consoleErrors.push(message.text());
          }
        });

        try {
          await page.goto(baseURL);
          await expect(page.locator("body")).toBeVisible();
          return {
            index,
            title: await page.title(),
            consoleErrors,
          };
        } finally {
          await context.close();
        }
      })
    );

    await testInfo.attach("browser-concurrency.json", {
      body: JSON.stringify(results, null, 2),
      contentType: "application/json",
    });

    expect(results).toHaveLength(sessionCount);
    expect(results.flatMap((result) => result.consoleErrors)).toEqual([]);
  });
});
