#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const templateRoot = path.join(packageRoot, "templates", "quality_test");
const cwd = process.cwd();

const help = `test-programme

通用质量测试体系 CLI，支持 Web/浏览器/App、E2E、并发、压测和 CI 门禁。

Usage:
  test-programme init [--dir quality_test] [--force]
  test-programme doctor [--root quality_test]
  test-programme e2e [--root quality_test] [-- ...playwright args]
  test-programme load [--root quality_test] [--profile smoke|stress]
  test-programme app [--root quality_test]
  test-programme gate [--root quality_test]
  test-programme system [--root quality_test]
  test-programme summary [--root quality_test]

Examples:
  npx test-programme init
  npx test-programme doctor
  npx test-programme system
`;

function parseArgs(argv) {
  const command = argv[0] && !argv[0].startsWith("-") ? argv[0] : "help";
  const rest = command === "help" ? argv : argv.slice(1);
  const parsed = {
    command,
    root: "quality_test",
    dir: "quality_test",
    force: false,
    profile: "smoke",
    passthrough: [],
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--") {
      parsed.passthrough = rest.slice(index + 1);
      break;
    }
    if (arg === "--help" || arg === "-h") {
      parsed.command = "help";
    } else if (arg === "--force") {
      parsed.force = true;
    } else if (arg === "--root") {
      parsed.root = rest[index + 1] || parsed.root;
      index += 1;
    } else if (arg.startsWith("--root=")) {
      parsed.root = arg.slice("--root=".length);
    } else if (arg === "--dir") {
      parsed.dir = rest[index + 1] || parsed.dir;
      parsed.root = parsed.dir;
      index += 1;
    } else if (arg.startsWith("--dir=")) {
      parsed.dir = arg.slice("--dir=".length);
      parsed.root = parsed.dir;
    } else if (arg === "--profile") {
      parsed.profile = rest[index + 1] || parsed.profile;
      index += 1;
    } else if (arg.startsWith("--profile=")) {
      parsed.profile = arg.slice("--profile=".length);
    }
  }

  return parsed;
}

function runNode(root, script, args = []) {
  const scriptPath = path.resolve(cwd, root, "scripts", script);
  if (!existsSync(scriptPath)) {
    console.error(`Cannot find ${scriptPath}. Run test-programme init first.`);
    process.exit(1);
  }

  const result = spawnSync("node", [scriptPath, ...args], {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  process.exit(result.status ?? 1);
}

async function initProject(options) {
  const targetDir = path.resolve(cwd, options.dir);
  if (existsSync(targetDir) && !options.force) {
    console.error(`${options.dir} already exists. Re-run with --force if you want to overwrite template files.`);
    process.exit(1);
  }

  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(templateRoot, targetDir, {
    recursive: true,
    force: options.force,
    errorOnExist: !options.force,
  });

  const packageJsonPath = path.resolve(cwd, "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    packageJson.scripts = {
      ...packageJson.scripts,
      "quality:doctor": `test-programme doctor --root ${options.dir}`,
      "quality:e2e": `test-programme e2e --root ${options.dir}`,
      "quality:load": `test-programme load --root ${options.dir}`,
      "quality:app": `test-programme app --root ${options.dir}`,
      "quality:gate": `test-programme gate --root ${options.dir}`,
      "quality:system": `test-programme system --root ${options.dir}`,
      "quality:summary": `test-programme summary --root ${options.dir}`,
    };
    await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  }

  console.log(`Created ${options.dir}.`);
  console.log("Next steps:");
  console.log(`  npm install -D test-programme`);
  console.log(`  npm run quality:doctor`);
  console.log(`  npm run quality:system`);
}

const options = parseArgs(process.argv.slice(2));

if (options.command === "help") {
  console.log(help);
} else if (options.command === "init") {
  await initProject(options);
} else if (options.command === "doctor") {
  runNode(options.root, "ensure-runtime.mjs");
} else if (options.command === "e2e") {
  runNode(options.root, "quality-gate.mjs", ["--suite", "full", ...options.passthrough]);
} else if (options.command === "load") {
  runNode(options.root, "load-test.mjs", ["--profile", options.profile]);
} else if (options.command === "app") {
  runNode(options.root, "app-test.mjs");
} else if (options.command === "gate") {
  runNode(options.root, "quality-gate.mjs");
} else if (options.command === "system") {
  runNode(options.root, "quality-system.mjs");
} else if (options.command === "summary") {
  runNode(options.root, "print-summary.mjs");
} else {
  console.error(`Unknown command: ${options.command}`);
  console.log(help);
  process.exit(1);
}
