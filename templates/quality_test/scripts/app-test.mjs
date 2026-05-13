import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { artifactsDir, readConfig, workspaceRoot } from "./config.mjs";
import { runCommand } from "./run-command.mjs";

async function runStep(target, key) {
  const command = target[key];
  if (!command) {
    return { step: key, command: "", exitCode: 0, skipped: true };
  }
  const result = await runCommand(command, { cwd: workspaceRoot, stdio: "inherit" });
  return { step: key, command, exitCode: result.exitCode, skipped: false };
}

const config = await readConfig();
const dir = artifactsDir(config);
await mkdir(dir, { recursive: true });

if (!config.app?.enabled) {
  const lines = ["# App Test Summary", "", `- Generated: ${new Date().toISOString()}`, "- Status: skipped", "- Reason: app.enabled is false"];
  await writeFile(path.join(dir, "app-summary.md"), `${lines.join("\n")}\n`, "utf8");
  console.log(lines.join("\n"));
  process.exit(0);
}

const targetResults = [];
for (const target of config.app.targets || []) {
  const steps = [];
  for (const key of ["doctorCommand", "installCommand", "startCommand", "testCommand"]) {
    const result = await runStep(target, key);
    steps.push(result);
    if (result.exitCode !== 0) {
      break;
    }
  }
  targetResults.push({
    name: target.name,
    platform: target.platform,
    driver: target.driver,
    status: steps.every((step) => step.exitCode === 0) ? "passed" : "failed",
    steps,
  });
}

const status = targetResults.every((target) => target.status === "passed") ? "passed" : "failed";
const lines = [
  "# App Test Summary",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- Status: ${status}`,
  "",
  "## Targets",
  "",
];

for (const target of targetResults) {
  lines.push(`- ${target.status === "passed" ? "PASS" : "FAIL"} ${target.name} (${target.platform}, ${target.driver})`);
}

await writeFile(path.join(dir, "app-results.json"), `${JSON.stringify({ status, targetResults }, null, 2)}\n`, "utf8");
await writeFile(path.join(dir, "app-summary.md"), `${lines.join("\n")}\n`, "utf8");
console.log(lines.join("\n"));
process.exit(status === "passed" ? 0 : 1);
