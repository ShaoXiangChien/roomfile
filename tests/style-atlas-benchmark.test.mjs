import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(".");
const benchmark = path.join(root, "examples/style-atlas-benchmark");
const validator = path.join(root, "scripts/validate-style-atlas-benchmark.mjs");

function run(directory = benchmark) {
  return spawnSync(
    process.execPath,
    [
      validator,
      "--benchmark",
      directory,
      "--atlas",
      path.join(root, "skills/roomfile/references/style-atlas/index.json"),
      "--json",
    ],
    { cwd: root, encoding: "utf8" },
  );
}

function report(result) {
  return JSON.parse(result.stdout || result.stderr);
}

async function copyBenchmark() {
  const directory = await mkdtemp(path.join(tmpdir(), "roomfile-benchmark-"));
  await cp(benchmark, directory, { recursive: true });
  return directory;
}

test("the committed Style Atlas benchmark is complete and reproducible", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = report(result);
  assert.equal(output.status, "success");
  assert.equal(output.errors.length, 0);
  assert.equal(output.artifacts.filter((item) => /\.(?:png|jpe?g|webp)$/i.test(item)).length, 7);
});

test("the benchmark validator rejects a missing generated output", async () => {
  const directory = await copyBenchmark();
  await rm(path.join(directory, "outputs/mid-century-modern-guided.jpg"), { force: true });
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "missing_output"),
    true,
  );
});

test("the benchmark validator rejects a malformed image with forged JPEG markers", async () => {
  const directory = await copyBenchmark();
  await writeFile(
    path.join(directory, "outputs/bauhaus-baseline.jpg"),
    Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  );
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "malformed_image"),
    true,
  );
});

test("every pair uses the exact same canonical source, locks, camera, and user evidence", async () => {
  const directory = await copyBenchmark();
  const requestPath = path.join(directory, "requests/bauhaus-guided.json");
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  request.camera_view = "A different camera position.";
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "pair_contract_mismatch"),
    true,
  );
});

test("baseline prompts cannot contain Atlas-only guidance or references", async () => {
  const directory = await copyBenchmark();
  const requestPath = path.join(directory, "requests/japandi-baseline.json");
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  request.style_context = {
    schema_version: "0.3.0",
    pack_refs: [],
    adopted_signals: [],
    rejected_signals: [],
    uncertain_signals: [],
    user_overrides: [],
    contradictions: [],
    live_research_sources: [],
    reference_images: [],
  };
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "baseline_uses_atlas"),
    true,
  );
});

test("guided prompts reference the exact Atlas pack and release version", async () => {
  const directory = await copyBenchmark();
  const requestPath = path.join(directory, "requests/mid-century-modern-guided.json");
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  request.style_context.pack_refs[0].version = "0.2.0";
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "guided_pack_mismatch"),
    true,
  );
});

test("generation records must reconcile all files, calls, and cost", async () => {
  const directory = await copyBenchmark();
  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  log.calls = log.calls.slice(0, 5);
  await writeFile(logPath, `${JSON.stringify(log, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "generation_log_mismatch"),
    true,
  );
});

test("generation totals must reconcile the preflight estimate", async () => {
  const directory = await copyBenchmark();
  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  log.totals.estimated_output_cost_usd = 9;
  await writeFile(logPath, `${JSON.stringify(log, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "generation_log_mismatch"),
    true,
  );
});

test("generation metadata must match parsed output dimensions and format", async () => {
  const directory = await copyBenchmark();
  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  log.calls[0].actual_image.width = 1;
  await writeFile(logPath, `${JSON.stringify(log, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "generation_log_mismatch"),
    true,
  );
});

test("cost estimate must predate every generation call", async () => {
  const directory = await copyBenchmark();
  const estimatePath = path.join(directory, "cost-estimate.json");
  const estimate = JSON.parse(await readFile(estimatePath, "utf8"));
  estimate.estimated_at = "2026-07-19T13:00:00+08:00";
  await writeFile(estimatePath, `${JSON.stringify(estimate, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "cost_estimate_mismatch"),
    true,
  );
});

test("public-demo metadata rejects secrets and private absolute paths", async () => {
  const directory = await copyBenchmark();
  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  log.calls[0].provider_interaction_id = `${"AI"}${"za"}012345678901234567890123456789`;
  log.calls[0].source = "/Users/example/private-room.png";
  await writeFile(logPath, `${JSON.stringify(log, null, 2)}\n`);
  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "private_metadata"),
    true,
  );
});
