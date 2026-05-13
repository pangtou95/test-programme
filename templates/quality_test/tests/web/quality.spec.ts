import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readQualityConfig } from "../config";

test.describe("Web Quality", () => {
  test("@quality has no serious accessibility, runtime, or layout regressions", async ({ page }, testInfo) => {
    const config = readQualityConfig();
    test.skip(!config.web.enabled, "web target is disabled");

    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "unknown"}`);
    });

    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    const axeResults = await new AxeBuilder({ page }).include("body").withTags(["wcag2a", "wcag2aa"]).analyze();
    const seriousViolations = axeResults.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact || "")
    );
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd || 0,
        loadCompleteMs: navigation?.loadEventEnd || 0,
        resourceCount: performance.getEntriesByType("resource").length,
      };
    });

    await testInfo.attach("quality-signals.json", {
      body: JSON.stringify({ consoleErrors, failedRequests, seriousViolations, metrics }, null, 2),
      contentType: "application/json",
    });

    expect(seriousViolations).toEqual([]);
    expect(consoleErrors.length).toBeLessThanOrEqual(config.web.maxConsoleErrors ?? 0);
    expect(failedRequests.length).toBeLessThanOrEqual(config.web.maxFailedRequests ?? 0);
    expect(metrics.pageWidth).toBeLessThanOrEqual(
      metrics.viewportWidth + (config.web.maxHorizontalOverflowPx ?? 2)
    );
    expect(metrics.domContentLoadedMs).toBeLessThan(config.web.budgets?.domContentLoadedMs ?? 8000);
    expect(metrics.loadCompleteMs).toBeLessThan(config.web.budgets?.loadCompleteMs ?? 12000);
    expect(metrics.resourceCount).toBeLessThan(config.web.budgets?.resourceCount ?? 120);
  });
});
