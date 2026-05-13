import { spawn } from "node:child_process";

export function runCommand(command, options = {}) {
  if (!command) {
    return Promise.resolve({ command, exitCode: 0, skipped: true, stdout: "", stderr: "" });
  }

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: options.cwd || process.cwd(),
      shell: true,
      env: { ...process.env, ...options.env },
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (options.stdio === "inherit") {
        process.stdout.write(chunk);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (options.stdio === "inherit") {
        process.stderr.write(chunk);
      }
    });
    child.on("close", (exitCode) => {
      resolve({ command, exitCode: exitCode ?? 1, skipped: false, stdout, stderr });
    });
  });
}
