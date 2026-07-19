import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function replaceOutput(directory, runId, bytes, actualImage) {
  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  const call = log.calls.find((item) => item.run_id === runId);
  await writeFile(path.join(directory, call.output), bytes);
  call.actual_image = actualImage;
  call.output_sha256 = sha256(bytes);
  await writeJson(logPath, log);
}

function forgedJpegSkeleton() {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]),
    Buffer.alloc(64, 1),
    Buffer.from([
      0xff, 0xc4, 0x00, 0x14, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00,
      0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01,
      0x01, 0x01, 0x11, 0x00,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
      0x01, 0xff, 0xd9,
    ]),
  ]);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function corruptPng(bytes, repairCrc) {
  const output = Buffer.from(bytes);
  let offset = 8;
  while (offset + 12 <= output.length) {
    const length = output.readUInt32BE(offset);
    const dataStart = offset + 8;
    if (output.subarray(offset + 4, dataStart).toString("ascii") === "IDAT" && length > 8) {
      output[dataStart + Math.floor(length / 2)] ^= 0xff;
      if (repairCrc) {
        output.writeUInt32BE(
          crc32(output.subarray(offset + 4, dataStart + length)),
          dataStart + length,
        );
      }
      return output;
    }
    offset += length + 12;
  }
  throw new Error("PNG fixture has no IDAT.");
}

async function replaceSource(directory, bytes) {
  await writeFile(path.join(directory, "source/source-room.png"), bytes);
  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  for (const call of log.calls) {
    call.source = { path: "source/source-room.png", sha256: sha256(bytes) };
  }
  await writeJson(logPath, log);
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

test("benchmark outputs reject a full marker skeleton and the wrong 2K dimensions", async () => {
  const directory = await copyBenchmark();
  await replaceOutput(
    directory,
    "bauhaus-baseline",
    forgedJpegSkeleton(),
    { format: "JPEG", width: 1, height: 1 },
  );
  let result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(report(result).errors.some((item) => item.code === "malformed_image"), true);

  const validWrongSize = await readFile(path.join(
    root,
    "skills/roomfile/references/style-atlas/styles/mid-century-modern/images/m-v3.jpg",
  ));
  await replaceOutput(
    directory,
    "bauhaus-baseline",
    validWrongSize,
    { format: "JPEG", width: 1600, height: 1200 },
  );
  result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "output_contract_mismatch"),
    true,
  );

  const validWrongAspect = await readFile(path.join(
    root,
    "skills/roomfile/references/style-atlas/styles/mid-century-modern/images/m-v1.jpg",
  ));
  await replaceOutput(
    directory,
    "bauhaus-baseline",
    validWrongAspect,
    { format: "JPEG", width: 1600, height: 1313 },
  );
  result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "output_contract_mismatch"),
    true,
  );
});

test("canonical PNG validation rejects bad CRC and corrupt compressed data", async () => {
  for (const repairCrc of [false, true]) {
    const directory = await copyBenchmark();
    const source = await readFile(path.join(directory, "source/source-room.png"));
    await replaceSource(directory, corruptPng(source, repairCrc));
    const result = run(directory);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.equal(report(result).errors.some((item) => item.code === "malformed_image"), true);
  }
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

test("generation provenance rejects chaining, mutable input hashes, and missing visual attachments", async () => {
  const directory = await copyBenchmark();
  const locksPath = path.join(directory, "locks.json");
  const locks = JSON.parse(await readFile(locksPath, "utf8"));
  locks.render_contract.fresh_source_edit_per_call = false;
  locks.render_contract.chained_edits = true;
  await writeJson(locksPath, locks);

  const requestPath = path.join(directory, "requests/bauhaus-guided.json");
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  request.style_context.reference_images = [];
  await writeJson(requestPath, request);

  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  log.source = "outputs/mid-century-modern-baseline.jpg";
  for (const call of log.calls) {
    call.fresh_source_edit = false;
    call.parent_interaction_id = log.calls[0].provider_interaction_id;
  }
  await writeJson(logPath, log);

  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const codes = report(result).errors.map((item) => item.code);
  assert.equal(codes.includes("generation_provenance_mismatch"), true);
  assert.equal(codes.includes("guided_pack_mismatch"), true);
});

test("each recorded source, request, prompt, locks, output, and visual hash is immutable", async () => {
  const directory = await copyBenchmark();
  const requestPath = path.join(directory, "requests/japandi-baseline.json");
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  request.style_evidence.push("Post-generation mutation.");
  await writeJson(requestPath, request);

  const logPath = path.join(directory, "generation-log.json");
  const log = JSON.parse(await readFile(logPath, "utf8"));
  const guided = log.calls.find((item) => item.run_id === "mid-century-modern-guided");
  guided.attached_reference_visuals = [];
  await writeJson(logPath, log);

  const result = run(directory);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    report(result).errors.some((item) => item.code === "generation_provenance_mismatch"),
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
