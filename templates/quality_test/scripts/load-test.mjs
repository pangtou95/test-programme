import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { artifactsDir, readConfig, workspaceRoot } from "./config.mjs";

function parseArgs(argv) {
  const parsed = { profile: "smoke", baseUrl: process.env.LOAD_TEST_BASE_URL || "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--profile") {
      parsed.profile = argv[index + 1] || parsed.profile;
      index += 1;
    } else if (arg.startsWith("--profile=")) {
      parsed.profile = arg.slice("--profile=".length);
    }
  }
  return parsed;
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function chooseEndpoint(endpoints) {
  const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const endpoint of endpoints) {
    cursor -= endpoint.weight;
    if (cursor <= 0) return endpoint;
  }
  return endpoints[endpoints.length - 1];
}

async function waitForTarget(baseUrl, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Target did not become ready: ${baseUrl}`);
}

async function startServer(loadConfig, baseUrl) {
  if (!loadConfig.startCommand || process.env.LOAD_TEST_BASE_URL) return null;
  const child = spawn(loadConfig.startCommand, { cwd: workspaceRoot, shell: true, stdio: ["ignore", "pipe", "pipe"] });
  await waitForTarget(baseUrl);
  return child;
}

async function runRequest(baseUrl, endpoint, timeoutMs) {
  const startedAt = performance.now();
  try {
    const response = await fetch(new URL(endpoint.path, baseUrl), { method: endpoint.method, signal: AbortSignal.timeout(timeoutMs) });
    await response.arrayBuffer();
    return { ok: response.ok, status: response.status, durationMs: performance.now() - startedAt, error: response.ok ? "" : `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, status: 0, durationMs: performance.now() - startedAt, error: error.message || "request failed" };
  }
}

async function runLoad({ baseUrl, endpoints, profile }) {
  const deadline = Date.now() + profile.durationSeconds * 1000;
  const results = [];
  async function worker() {
    while (Date.now() < deadline) {
      results.push(await runRequest(baseUrl, chooseEndpoint(endpoints), profile.requestTimeoutMs));
      if (profile.paceMs) await new Promise((resolve) => setTimeout(resolve, profile.paceMs));
    }
  }
  const startedAt = performance.now();
  await Promise.all(Array.from({ length: profile.concurrency }, () => worker()));
  return { durationMs: performance.now() - startedAt, results };
}

function summarize({ profileName, profile, baseUrl, durationMs, results }) {
  const successful = results.filter((result) => result.ok);
  const durations = successful.map((result) => result.durationMs);
  const metrics = {
    profile: profileName,
    baseUrl,
    totalRequests: results.length,
    successRate: results.length ? successful.length / results.length : 0,
    errorRate: results.length ? (results.length - successful.length) / results.length : 1,
    requestsPerSecond: results.length / (durationMs / 1000),
    avgMs: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0,
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
  };
  const thresholds = [
    { name: "minRequests", actual: metrics.totalRequests, expected: profile.thresholds.minRequests, passed: metrics.totalRequests >= profile.thresholds.minRequests },
    { name: "successRate", actual: metrics.successRate, expected: profile.thresholds.successRate, passed: metrics.successRate >= profile.thresholds.successRate },
    { name: "maxErrorRate", actual: metrics.errorRate, expected: profile.thresholds.maxErrorRate, passed: metrics.errorRate <= profile.thresholds.maxErrorRate },
    { name: "p95Ms", actual: metrics.p95Ms, expected: profile.thresholds.p95Ms, passed: metrics.p95Ms <= profile.thresholds.p95Ms },
    { name: "p99Ms", actual: metrics.p99Ms, expected: profile.thresholds.p99Ms, passed: metrics.p99Ms <= profile.thresholds.p99Ms },
  ];
  return { generatedAt: new Date().toISOString(), status: thresholds.every((threshold) => threshold.passed) ? "passed" : "failed", metrics, thresholds };
}

async function writeSummary(config, summary) {
  const dir = artifactsDir(config);
  const slug = summary.metrics.profile.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const lines = ["# Load Test Summary", "", `- Generated: ${summary.generatedAt}`, `- Status: ${summary.status}`, `- Profile: ${summary.metrics.profile}`, `- Target: ${summary.metrics.baseUrl}`, `- Total requests: ${summary.metrics.totalRequests}`, `- Success rate: ${(summary.metrics.successRate * 100).toFixed(2)}%`, `- Error rate: ${(summary.metrics.errorRate * 100).toFixed(2)}%`, `- RPS: ${summary.metrics.requestsPerSecond.toFixed(2)}`, `- Avg: ${summary.metrics.avgMs.toFixed(1)}ms`, `- P95: ${summary.metrics.p95Ms.toFixed(1)}ms`, `- P99: ${summary.metrics.p99Ms.toFixed(1)}ms`, "", "## Thresholds", "", ...summary.thresholds.map((threshold) => `- ${threshold.passed ? "PASS" : "FAIL"} ${threshold.name}: actual=${Number(threshold.actual).toFixed(3)}, expected=${threshold.expected}`)];
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "load-summary.md"), `${lines.join("\n")}\n`, "utf8");
  await writeFile(path.join(dir, "load-results.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(path.join(dir, `load-summary-${slug}.md`), `${lines.join("\n")}\n`, "utf8");
  await writeFile(path.join(dir, `load-results-${slug}.json`), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(lines.join("\n"));
}

const config = await readConfig();
const args = parseArgs(process.argv.slice(2));
const profile = config.load.profiles[args.profile];
if (!profile) throw new Error(`Unknown load profile "${args.profile}"`);
const baseUrl = args.baseUrl || config.load.baseUrl;
let server = null;
try {
  server = await startServer(config.load, baseUrl);
  await waitForTarget(baseUrl);
  const run = await runLoad({ baseUrl, endpoints: config.load.endpoints, profile });
  const summary = summarize({ profileName: args.profile, profile, baseUrl, ...run });
  await writeSummary(config, summary);
  process.exit(summary.status === "passed" ? 0 : 1);
} finally {
  server?.kill();
}
