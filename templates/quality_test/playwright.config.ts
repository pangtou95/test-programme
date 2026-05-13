import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, "quality-test.config.json");
const qualityConfig = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : { web: { baseURL: "http://127.0.0.1:3000", startCommand: "" }, project: { artifactsDir: "quality_test/artifacts" } };

const webServer = qualityConfig.web?.startCommand
  ? {
      command: qualityConfig.web.startCommand,
      port: qualityConfig.web.serverPort || 3000,
      reuseExistingServer: qualityConfig.web.reuseExistingServer !== false,
      timeout: 120000,
    }
  : undefined;

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: "./artifacts/test-results",
  reporter: [
    ["list"],
    ["json", { outputFile: "./artifacts/results.json" }],
    ["junit", { outputFile: "./artifacts/junit.xml" }],
    ["html", { open: "never", outputFolder: "./artifacts/playwright-report" }],
  ],
  use: {
    baseURL: process.env.QUALITY_TEST_BASE_URL || qualityConfig.web?.baseURL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
  webServer,
});
