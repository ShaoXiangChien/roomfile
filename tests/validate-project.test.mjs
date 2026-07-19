import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
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

async function writeProfile(target) {
  const profilePath = path.join(target, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify({
      project_name: "Test home",
      country: "AU",
      region: "Victoria",
      postal_code: "3000",
      currency: "AUD",
      measurement_unit: "cm",
      budget: { amount: 5000, currency: "AUD" },
      preferred_retailers: ["Temple & Webster"],
      retailer_strategy: "user-preferred",
      rooms: [{ id: "living-room", name: "Living room" }],
    }),
  );
  return profilePath;
}

test("validator accepts an initialized project and reports its artifacts", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-valid-"));
  const profilePath = await writeProfile(target);
  assert.equal(
    run(
      initScript,
      [
        "--target",
        target,
        "--privacy",
        "public-demo",
        "--profile",
        profilePath,
        "--json",
      ],
      target,
    )
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

test("validator rejects v0.3 style context with more than four reference images", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-style-context-"));
  const profilePath = await writeProfile(target);
  run(initScript, ["--target", target, "--privacy", "public-demo", "--profile", profilePath, "--json"], target);
  const contextPath = path.join(target, "roomfile", "inspiration", "style-context.json");
  const context = JSON.parse(await readFile(contextPath, "utf8"));
  context.reference_images = Array.from({ length: 5 }, (_, index) => ({
    pack_id: "warm-minimal", visual_id: `visual-${index}`, path: `image-${index}.jpg`, reason: "test",
  }));
  await writeFile(contextPath, JSON.stringify(context, null, 2));
  const result = run(validateScript, ["--project", path.join(target, "roomfile"), "--json"], target);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).errors.some((item) => item.code === "invalid_style_context"), true);
});

test("validator enforces every constrained style-context record", async (t) => {
  const validPackRef = {
    id: "warm-minimal",
    version: "0.3.0",
    read_at: "2026-07-19T12:00:00Z",
  };
  const cases = [
    ["top-level additional properties", (context) => { context.private_provider_state = {}; }],
    ["pack-ref additional properties", (context) => { context.pack_refs = [{ ...validPackRef, extra: true }]; }],
    ["blank pack IDs", (context) => { context.pack_refs = [{ ...validPackRef, id: "" }]; }],
    ["blank pack versions", (context) => { context.pack_refs = [{ ...validPackRef, version: "" }]; }],
    ["invalid pack timestamps", (context) => { context.pack_refs = [{ ...validPackRef, read_at: "yesterday" }]; }],
    ["malformed signal strings", (context) => { context.adopted_signals = [""]; }],
    ["malformed signal records", (context) => { context.user_overrides = [{ reason: "missing signal" }]; }],
    ["malformed live source URLs", (context) => { context.live_research_sources = [{ url: "not a URI" }]; }],
    ["malformed live source timestamps", (context) => { context.live_research_sources = [{ url: "https://example.test", retrieved_at: "soon" }]; }],
    ["live source additional properties", (context) => { context.live_research_sources = [{ url: "https://example.test", provider_state: "private" }]; }],
    ["reference-image additional properties", (context) => { context.reference_images = [{ pack_id: "p", visual_id: "v", path: "v.jpg", reason: "fit", extra: true }]; }],
    ["blank reference-image fields", (context) => { context.reference_images = [{ pack_id: "", visual_id: "v", path: "v.jpg", reason: "fit" }]; }],
  ];

  for (const [name, mutate] of cases) {
    await t.test(`rejects ${name}`, async () => {
      const target = await mkdtemp(path.join(tmpdir(), "roomfile-style-contract-"));
      const profilePath = await writeProfile(target);
      run(initScript, ["--target", target, "--privacy", "public-demo", "--profile", profilePath, "--json"], target);
      const contextPath = path.join(target, "roomfile", "inspiration", "style-context.json");
      const context = JSON.parse(await readFile(contextPath, "utf8"));
      mutate(context);
      await writeFile(contextPath, JSON.stringify(context, null, 2));
      const result = run(validateScript, ["--project", path.join(target, "roomfile"), "--json"], target);
      assert.equal(result.status, 1, result.stderr || result.stdout);
      assert.equal(JSON.parse(result.stdout).errors.some((item) => item.code === "invalid_style_context"), true);
    });
  }
});

test("validator rejects a v0.3 project whose shopping profile is incomplete", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-incomplete-"));
  run(initScript, ["--target", target, "--privacy", "public-demo", "--json"], target);

  const result = run(
    validateScript,
    ["--project", path.join(target, "roomfile"), "--json"],
    target,
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(
    report.errors.some((item) => item.code === "shopping_profile_incomplete"),
    true,
  );
});

test("validator accepts a complete v0.1 project with an upgrade warning", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-legacy-"));
  const project = path.join(target, "roomfile");
  await cp(path.resolve("examples/us-apartment/roomfile"), project, {
    recursive: true,
  });
  await setSchemaVersion(project, "0.1.0");
  const result = run(
    validateScript,
    ["--project", project, "--json"],
    process.cwd(),
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(
    report.warnings.some((item) => item.code === "schema_upgrade_available"),
    true,
  );
});

async function setSchemaVersion(directory, version) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await setSchemaVersion(file, version);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      const value = JSON.parse(await readFile(file, "utf8"));
      if (value?.schema_version) {
        value.schema_version = version;
        await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
      }
    }
  }
}

test("validator rejects inferred facts that are marked critical for fit", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-invalid-"));
  const profilePath = await writeProfile(target);
  run(
    initScript,
    [
      "--target",
      target,
      "--privacy",
      "public-demo",
      "--profile",
      profilePath,
      "--json",
    ],
    target,
  );

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
  const profilePath = await writeProfile(target);
  run(
    initScript,
    [
      "--target",
      target,
      "--privacy",
      "public-demo",
      "--profile",
      profilePath,
      "--json",
    ],
    target,
  );
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
    price: { amount: 99, currency: "AUD" },
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
  const profilePath = await writeProfile(target);
  run(
    initScript,
    [
      "--target",
      target,
      "--privacy",
      "public-demo",
      "--profile",
      profilePath,
      "--json",
    ],
    target,
  );
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
        schema_version: "0.3.0",
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
