import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type QualityConfig = {
  web: {
    enabled: boolean;
    baseURL: string;
    requiredText?: string;
    maxConsoleErrors?: number;
    maxFailedRequests?: number;
    maxHorizontalOverflowPx?: number;
    budgets?: {
      domContentLoadedMs?: number;
      loadCompleteMs?: number;
      resourceCount?: number;
    };
  };
};

export function readQualityConfig(): QualityConfig {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const configPath = path.resolve(__dirname, "..", "quality-test.config.json");
  if (!existsSync(configPath)) {
    throw new Error(`Missing quality-test.config.json at ${configPath}`);
  }
  return JSON.parse(readFileSync(configPath, "utf8")) as QualityConfig;
}
