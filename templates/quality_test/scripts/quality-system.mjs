import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { artifactsDir, qualityRoot, readConfig, workspaceRoot } from "./config.mjs";

const config = await readConfig();
const steps = [
  { name: "Web/browser E2E gate", args: ["quality-gate.mjs"], summary: "quality-summary.md" },
  { name: "App adapter gate", args: ["app-test.mjs"], summary: "app-summary.md" },
  { name: "HTTP smoke load gate", args: ["load-test.mjs", "--profile", "smoke"], summary: "load-summary-smoke.md" },
];

const results = [];
for (const step of steps) {
  const startedAt = Date.now();
  const result = spawnSync("node", [path.join(qualityRoot, "scripts", ...step.args)], {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  results.push({ ...step, exitCode: result.status ?? 1, durationSeconds: (Date.now() - startedAt) / 1000 });
}

const status = results.every((result) => result.exitCode === 0) ? "passed" : "failed";
const lines = [
  "# Quality System Summary",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- Status: ${status}`,
  "",
  "## Steps",
  "",
  ...results.map((result) => `- ${result.exitCode === 0 ? "PASS" : "FAIL"} ${result.name}: exit=${result.exitCode}, duration=${result.durationSeconds.toFixed(1)}s`),
  "",
  "## Linked Summaries",
  "",
  ...results.map((result) => `- \`${config.project.artifactsDir}/${result.summary}\``),
];

const dir = artifactsDir(config);
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, "quality-system-summary.md"), `${lines.join("\n")}\n`, "utf8");
console.log(await readFile(path.join(dir, "quality-system-summary.md"), "utf8"));
process.exit(status === "passed" ? 0 : 1);
