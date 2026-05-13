import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { readConfig, workspaceRoot } from "./config.mjs";

const require = createRequire(import.meta.url);
const requiredPackages = ["@playwright/test", "playwright", "@axe-core/playwright"];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function canResolve(packageName) {
  try {
    require.resolve(packageName, { paths: [workspaceRoot] });
    return true;
  } catch {
    return false;
  }
}

function ensurePackages() {
  const missingPackages = requiredPackages.filter((packageName) => !canResolve(packageName));
  if (!missingPackages.length) {
    return;
  }

  console.log(`[quality-test] Missing packages: ${missingPackages.join(", ")}`);
  run("npm", ["install", "-D", ...missingPackages]);
}

async function ensureChromium() {
  const { chromium } = await import("playwright");
  const executablePath = chromium.executablePath();

  if (existsSync(executablePath)) {
    return;
  }

  const installArgs =
    process.platform === "linux"
      ? ["playwright", "install", "--with-deps", "chromium"]
      : ["playwright", "install", "chromium"];
  run("npx", installArgs);
}

const config = await readConfig();
ensurePackages();
if (config.web?.enabled !== false) {
  await ensureChromium();
}
console.log("[quality-test] Runtime check passed.");
