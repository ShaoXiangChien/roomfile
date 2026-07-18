import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const initScript = path.resolve("skills/roomfile/scripts/init-project.mjs");
const validateScript = path.resolve("skills/roomfile/scripts/validate-project.mjs");

function run(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("validator accepts an initialized project and reports its artifacts", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-valid-"));
  assert.equal(
    run(initScript, ["--target", target, "--privacy", "public-demo", "--json"], target)
      .status,
    0,
  );

  const result = run(
    validateScript,
    ["--project", path.join(target, "roomfile"), "--json"],
    target,
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "success");
  assert.equal(report.artifacts.some((item) => item.endsWith("geometry.json")), true);
});

test("validator rejects inferred facts that are marked critical for fit", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-invalid-"));
  run(initScript, ["--target", target, "--privacy", "public-demo", "--json"], target);

  const factsPath = path.join(
    target,
    "roomfile",
    "rooms",
    "living-room",
    "facts.json",
  );
  const facts = JSON.parse(await readFile(factsPath, "utf8"));
  facts.facts.push({
    id: "window-width",
    label: "Window width",
    classification: "inferred",
    confidence: 0.6,
    source: "source-room.jpg",
    critical_for_fit: true,
    value: { amount: 72, unit: "in" },
  });
  await writeFile(factsPath, JSON.stringify(facts, null, 2));

  const result = run(
    validateScript,
    ["--project", path.join(target, "roomfile"), "--json"],
    target,
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(
    report.errors.some((item) => item.code === "critical_fact_not_measured"),
    true,
  );
});

test("validator rejects approved products without explicit user approval", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-unapproved-product-"));
  run(initScript, ["--target", target, "--privacy", "public-demo", "--json"], target);
  const productsPath = path.join(
    target,
    "roomfile",
    "rooms",
    "living-room",
    "products.json",
  );
  const products = JSON.parse(await readFile(productsPath, "utf8"));
  products.products.push({
    id: "table",
    name: "Candidate table",
    role: "coffee-table",
    retailer: "IKEA US",
    product_identifier: "000.000.00",
    dimensions: { width: 40, depth: 20, height: 16, unit: "in" },
    price: { amount: 99, currency: "USD" },
    source: {
      url: "https://www.ikea.com/us/en/",
      retrieved_at: "2026-07-18T00:00:00Z",
    },
    status: "approved",
  });
  await writeFile(productsPath, JSON.stringify(products, null, 2));

  const result = run(
    validateScript,
    ["--project", path.join(target, "roomfile"), "--json"],
    target,
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(
    report.errors.some(
      (item) => item.code === "approved_product_missing_user_approval",
    ),
    true,
  );
});

test("validator rejects approved concepts without an approved decision", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-unapproved-concept-"));
  run(initScript, ["--target", target, "--privacy", "public-demo", "--json"], target);
  const conceptDirectory = path.join(
    target,
    "roomfile",
    "rooms",
    "living-room",
    "concepts",
    "quiet-modern",
  );
  await mkdir(conceptDirectory, { recursive: true });
  await writeFile(
    path.join(conceptDirectory, "concept.json"),
    JSON.stringify(
      {
        schema_version: "0.1.0",
        id: "quiet-modern",
        version: 1,
        status: "approved",
        style_direction: "Quiet Modern",
        locked_elements: [],
        allowed_changes: [],
        decisions: [
          {
            decision: "Agent selected it.",
            approved_by_user: false,
            recorded_at: "2026-07-18T00:00:00Z",
          },
        ],
        renders: [],
      },
      null,
      2,
    ),
  );

  const result = run(
    validateScript,
    ["--project", path.join(target, "roomfile"), "--json"],
    target,
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(
    report.errors.some(
      (item) => item.code === "approved_concept_missing_user_approval",
    ),
    true,
  );
});
