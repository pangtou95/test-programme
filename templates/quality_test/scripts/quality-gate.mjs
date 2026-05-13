import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { artifactsDir, qualityRoot, readConfig, workspaceRoot } from "./config.mjs";

const suites = {
  full: [],
  smoke: ["--grep", "@smoke"],
  quality: ["--grep", "@quality"],
  performance: ["--grep", "@performance"],
  concurrency: ["--grep", "@concurrency"],
};

function parseArgs(argv) {
  const parsed = { suite: "full", passthrough: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--suite") {
      parsed.suite = argv[index + 1] || parsed.suite;
      index += 1;
    } else if (arg.startsWith("--suite=")) {
      parsed.suite = arg.slice("--suite=".length);
    } else {
      parsed.passthrough.push(arg);
    }
  }
  if (!suites[parsed.suite]) throw new Error(`Unknown suite ${parsed.suite}`);
  return parsed;
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: workspaceRoot, stdio: "inherit", shell: process.platform === "win32" });
  return result.status ?? 1;
}

function collectStats(parsed) {
  const stats = { total: 0, passed: 0, skipped: 0, flaky: 0, failed: 0 };
  function visitSuite(node) {
    for (const child of node.suites || []) visitSuite(child);
    for (const spec of node.specs || []) {
      for (const test of spec.tests || []) {
        stats.total += 1;
        if (test.status === "expected") stats.passed += 1;
        else if (test.status === "skipped") stats.skipped += 1;
        else if (test.status === "flaky") stats.flaky += 1;
        else stats.failed += 1;
      }
    }
  }
  for (const suite of parsed.suites || []) visitSuite(suite);
  return stats;
}

async function writeSummary(config, suite, exitCode) {
  const dir = artifactsDir(config);
  const resultsPath = path.join(dir, "results.json");
  let stats = null;
  try { stats = collectStats(JSON.parse(await readFile(resultsPath, "utf8"))); } catch {}
  const lines = ["# Quality Gate Summary", "", `- Generated: ${new Date().toISOString()}`, `- Suite: ${suite}`, `- Status: ${exitCode === 0 ? "passed" : "failed"}`, `- Exit code: ${exitCode}`];
  if (stats) lines.push(`- Total: ${stats.total}`, `- Passed: ${stats.passed}`, `- Skipped: ${stats.skipped}`, `- Flaky: ${stats.flaky}`, `- Failed: ${stats.failed}`);
  lines.push("", "## Artifacts", "", "- `quality_test/artifacts/playwright-report/index.html`", "- `quality_test/artifacts/results.json`", "- `quality_test/artifacts/junit.xml`");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "quality-summary.md"), `${lines.join("\n")}\n`, "utf8");
}

const config = await readConfig();
const options = parseArgs(process.argv.slice(2));
const dir = artifactsDir(config);
await mkdir(dir, { recursive: true });
const doctorExit = run("node", [path.join(qualityRoot, "scripts", "ensure-runtime.mjs")]);
if (doctorExit !== 0) process.exit(doctorExit);
const args = ["playwright", "test", `--config=${path.join(qualityRoot, "playwright.config.ts")}`, ...suites[options.suite], ...options.passthrough];
const exitCode = run("npx", args);
await writeSummary(config, options.suite, exitCode);
process.exit(exitCode);
