import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const qualityRoot = path.resolve(__dirname, "..");
export const workspaceRoot = path.resolve(qualityRoot, "..");
export const configPath = path.join(qualityRoot, "quality-test.config.json");

export async function readConfig() {
  if (!existsSync(configPath)) {
    throw new Error(`Missing config: ${configPath}`);
  }
  return JSON.parse(await readFile(configPath, "utf8"));
}

export function artifactsDir(config) {
  return path.resolve(workspaceRoot, config.project?.artifactsDir || "quality_test/artifacts");
}
