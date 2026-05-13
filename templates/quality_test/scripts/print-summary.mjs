import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { artifactsDir, readConfig } from "./config.mjs";

const config = await readConfig();
const dir = artifactsDir(config);
const summaries = [
  "quality-system-summary.md",
  "quality-summary.md",
  "app-summary.md",
  "load-summary.md",
];

for (const file of summaries) {
  const summaryPath = path.join(dir, file);
  if (existsSync(summaryPath)) {
    console.log(await readFile(summaryPath, "utf8"));
  }
}
