import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const resolveScript = path.resolve("skills/roomfile/scripts/resolve-style.mjs");
const validateScript = path.resolve("skills/roomfile/scripts/validate-style-atlas.mjs");

function run(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
}

function rewriteJpegFrame(bytes, width, height) {
  const output = Buffer.from(bytes);
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;
  while (offset < output.length) {
    while (output[offset] === 0xff) offset += 1;
    const marker = output[offset];
    offset += 1;
    if (startOfFrame.has(marker)) {
      output.writeUInt16BE(height, offset + 3);
      output.writeUInt16BE(width, offset + 5);
      return output;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    offset += output.readUInt16BE(offset);
  }
  throw new Error("Test fixture does not contain a JPEG frame.");
}

function truncateAfterFirstJpegFrame(bytes) {
  let offset = 2;
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  while (offset < bytes.length) {
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    const length = bytes.readUInt16BE(offset);
    if (startOfFrame.has(marker)) return bytes.subarray(0, offset + length);
    offset += length;
  }
  throw new Error("Test fixture does not contain a JPEG frame.");
}

async function replaceFirstVisualImage(atlas, bytes, dimensions) {
  const pack = path.join(atlas, "warm-minimal");
  const visualsPath = path.join(pack, "visuals.json");
  const document = JSON.parse(await readFile(visualsPath, "utf8"));
  const visual = document.visuals[0];
  await writeFile(path.join(pack, visual.path), bytes);
  visual.byte_size = bytes.byteLength;
  visual.sha256 = createHash("sha256").update(bytes).digest("hex");
  if (dimensions) {
    visual.width = dimensions.width;
    visual.height = dimensions.height;
  }
  await writeFile(visualsPath, JSON.stringify(document, null, 2));
}

const requiredSignals = [
  "historical_core", "current_expressions", "composition", "furniture_forms",
  "materials", "palette", "lighting", "textiles_art", "spatial_density",
  "variants", "adjacent_styles", "questions", "cliches_to_avoid",
  "positive_prompt_guidance", "negative_prompt_guidance",
];

async function createAtlas() {
  const atlas = await mkdtemp(path.join(tmpdir(), "roomfile-atlas-"));
  const packs = [
    { id: "warm-minimal", name: "Warm Minimal", aliases: ["warm-minimalism"] },
    { id: "soft-industrial", name: "Soft Industrial", aliases: ["soft industrial style"] },
    { id: "japanese-modern", name: "和風モダン", aliases: ["和風", "Japanese modern", "कला"] },
  ];
  await writeFile(path.join(atlas, "index.json"), JSON.stringify({ schema_version: "0.3.0", packs }, null, 2));
  for (const pack of packs) await createPack(atlas, pack);
  return atlas;
}

async function createPack(atlas, pack) {
  const directory = path.join(atlas, pack.id);
  await mkdir(path.join(directory, "images"), { recursive: true });
  const sources = Array.from({ length: 25 }, (_, index) => ({
    id: `source-${index + 1}`,
    title: `Test source ${index + 1}`,
    publisher: "Example Publisher",
    url: `https://example.test/${pack.id}/${index + 1}`,
    tier: index < 8 ? 1 : 2,
    kind: index < 5 ? "contemporary" : index < 8 ? "critical" : "reference",
    supports: "A contract-test source record.",
    retrieved_at: "2026-07-19",
  }));
  const visuals = [];
  const attributionSections = [];
  const bytes = await readFile(path.resolve(
    "skills/roomfile/references/style-atlas/styles/mid-century-modern/images/m-v1.jpg",
  ));
  for (let index = 0; index < 12; index += 1) {
    const file = `images/${index + 1}.jpg`;
    await writeFile(path.join(directory, file), bytes);
    const visual = {
      id: `visual-${index + 1}`,
      source_id: "source-1",
      path: file,
      license: "CC0-1.0",
      original_url: `https://upload.wikimedia.org/${pack.id}/${index + 1}.jpg`,
      source_page: `https://commons.wikimedia.org/wiki/File:${pack.id}-${index + 1}.jpg`,
      creator: "Test creator",
      work_title: `Test image ${index + 1}`,
      work_date: "2026",
      institution: "Test institution",
      license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
      attribution: "Test creator, CC0-1.0.",
      retrieved_at: "2026-07-19",
      derivative: "Synthetic test fixture.",
      byte_size: bytes.byteLength,
      width: 1600,
      height: 1313,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      alt: `A steel-framed house exterior with paneled walls and garden planting, fixture ${index + 1}.`,
      caption: `Caption ${index + 1}`,
      what_to_notice: "Notice this material relationship.",
      what_not_to_generalize: "Do not generalize it to every room.",
    };
    visuals.push(visual);
    attributionSections.push([
      `## ${visual.id} — ${visual.work_title}`,
      "",
      visual.attribution,
      "",
      `- Creator: ${visual.creator}`,
      `- Work/date: ${visual.work_title}; ${visual.work_date}`,
      `- Institution: ${visual.institution}`,
      `- License: [${visual.license}](${visual.license_url})`,
      `- Authoritative file page: ${visual.source_page}`,
      `- Direct original: ${visual.original_url}`,
    ].join("\n"));
  }
  await writeFile(path.join(directory, "style-pack.json"), JSON.stringify({
    schema_version: "0.3.0", id: pack.id, name: pack.name, aliases: pack.aliases,
    version: "0.3.0",
    reviewed_at: "2026-07-19",
    source_ids: sources.map((source) => source.id),
    visual_ids: visuals.map((visual) => visual.id),
  }, null, 2));
  await writeFile(path.join(directory, "manifest.json"), JSON.stringify({
    schema_version: "0.3.0",
    id: pack.id,
    files: [
      "manifest.json", "style-pack.json", "quick-guide.md", "field-guide.md",
      "signals.json", "sources.json", "visuals.json", "ATTRIBUTION.md",
    ],
  }, null, 2));
  await writeFile(path.join(directory, "quick-guide.md"), Array.from({ length: 800 }, (_, index) => `word${index}`).join(" "));
  await writeFile(path.join(directory, "field-guide.md"), "# Field guide\n\nEvidence [source-1].");
  await writeFile(path.join(directory, "signals.json"), JSON.stringify({
    schema_version: "0.3.0",
    id: pack.id,
    ...Object.fromEntries(requiredSignals.map((key) => [key, ["fixture"]])),
  }, null, 2));
  await writeFile(path.join(directory, "sources.json"), JSON.stringify({ schema_version: "0.3.0", sources }, null, 2));
  await writeFile(path.join(directory, "visuals.json"), JSON.stringify({ schema_version: "0.3.0", visuals }, null, 2));
  await writeFile(
    path.join(directory, "ATTRIBUTION.md"),
    `# Attribution\n\nCC0-1.0 test fixtures.\n\n${attributionSections.join("\n\n")}`,
  );
}

test("style resolver returns exact metadata for an alias and normalizes punctuation", async () => {
  const atlas = await createAtlas();
  const result = run(resolveScript, ["--atlas", atlas, "--style", "  WARM_minimalism!! ", "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "success");
  assert.deepEqual(report.pack, { id: "warm-minimal", name: "Warm Minimal", aliases: ["warm-minimalism"] });
});

test("style resolver does not fuzzy match unknown styles", async () => {
  const atlas = await createAtlas();
  const result = run(resolveScript, ["--atlas", atlas, "--style", "warm minimalish", "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "needs-live-research");
});

test("style resolver matches a Unicode canonical name", async () => {
  const atlas = await createAtlas();
  const result = run(resolveScript, ["--atlas", atlas, "--style", "和風 モダン", "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).pack.id, "japanese-modern");
});

test("style resolver matches a Unicode alias", async () => {
  const atlas = await createAtlas();
  const result = run(resolveScript, ["--atlas", atlas, "--style", "《和風》", "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).pack.id, "japanese-modern");
});

test("style resolver sends an unknown Unicode style to live research", async () => {
  const atlas = await createAtlas();
  const result = run(resolveScript, ["--atlas", atlas, "--style", "侘寂未来派", "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "needs-live-research");
});

test("style resolver preserves combining marks instead of false-matching a distinct style", async () => {
  const atlas = await createAtlas();
  const result = run(resolveScript, ["--atlas", atlas, "--style", "कली", "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "needs-live-research");
});

test("atlas validator accepts a complete three-pack atlas", async () => {
  const atlas = await createAtlas();
  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "success");
});

test("atlas validator rejects a malformed JPEG even when its hash and byte count match", async () => {
  const atlas = await createAtlas();
  const bytes = Buffer.from("not actually a JPEG");
  await replaceFirstVisualImage(atlas, bytes);

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "malformed_image"),
    true,
  );
});

test("atlas validator rejects an 11-byte SOI and forged SOF without component data or a scan", async () => {
  const atlas = await createAtlas();
  const bytes = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x07, 0x08, 0x00, 0x01, 0x00, 0x01,
  ]);
  await replaceFirstVisualImage(atlas, bytes, { width: 1, height: 1 });

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "malformed_image"),
    true,
  );
});

test("atlas validator rejects a JPEG truncated immediately after its SOF component table", async () => {
  const atlas = await createAtlas();
  const imagePath = path.join(atlas, "warm-minimal", "images/1.jpg");
  const bytes = truncateAfterFirstJpegFrame(await readFile(imagePath));
  await replaceFirstVisualImage(atlas, bytes);

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "malformed_image"),
    true,
  );
});

test("atlas validator rejects a JPEG truncated before its EOI marker", async () => {
  const atlas = await createAtlas();
  const imagePath = path.join(atlas, "warm-minimal", "images/1.jpg");
  const original = await readFile(imagePath);
  assert.deepEqual([...original.subarray(-2)], [0xff, 0xd9]);
  await replaceFirstVisualImage(atlas, original.subarray(0, -2));

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "malformed_image"),
    true,
  );
});

test("atlas validator compares parsed JPEG frame dimensions with visual metadata", async () => {
  const atlas = await createAtlas();
  const visualsPath = path.join(atlas, "warm-minimal", "visuals.json");
  const document = JSON.parse(await readFile(visualsPath, "utf8"));
  document.visuals[0].width = 1599;
  await writeFile(visualsPath, JSON.stringify(document, null, 2));

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "image_dimension_mismatch"),
    true,
  );
});

test("atlas validator enforces the 1600px cap against parsed JPEG frame dimensions", async () => {
  const atlas = await createAtlas();
  const pack = path.join(atlas, "warm-minimal");
  const visualsPath = path.join(pack, "visuals.json");
  const document = JSON.parse(await readFile(visualsPath, "utf8"));
  const visual = document.visuals[0];
  const imagePath = path.join(pack, visual.path);
  const bytes = rewriteJpegFrame(await readFile(imagePath), 1601, 1313);
  await writeFile(imagePath, bytes);
  visual.sha256 = createHash("sha256").update(bytes).digest("hex");
  await writeFile(visualsPath, JSON.stringify(document, null, 2));

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const codes = JSON.parse(result.stdout).errors.map((item) => item.code);
  assert.equal(codes.includes("invalid_image_dimensions"), true);
  assert.equal(codes.includes("image_dimension_mismatch"), true);
});

test("atlas validator requires a complete per-visual attribution section", async () => {
  const atlas = await createAtlas();
  const attributionPath = path.join(atlas, "warm-minimal", "ATTRIBUTION.md");
  const attribution = await readFile(attributionPath, "utf8");
  await writeFile(
    attributionPath,
    attribution.replace("- Institution: Test institution", "- Institution:"),
  );

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "missing_visual_attribution"),
    true,
  );
});

test("atlas validator requires pack references to cover complete source and visual inventories", async () => {
  const atlas = await createAtlas();
  const packPath = path.join(atlas, "warm-minimal", "style-pack.json");
  const pack = JSON.parse(await readFile(packPath, "utf8"));
  pack.source_ids = pack.source_ids.slice(0, -1);
  pack.visual_ids = pack.visual_ids.slice(0, -1);
  await writeFile(packPath, JSON.stringify(pack, null, 2));

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "incomplete_pack_references"),
    true,
  );
});

test("atlas validator reconciles field-guide citations to source IDs", async () => {
  const atlas = await createAtlas();
  await writeFile(
    path.join(atlas, "warm-minimal", "field-guide.md"),
    "# Field guide\n\nUnsupported evidence [missing-source].",
  );

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "unknown_field_guide_citation"),
    true,
  );
});

test("atlas validator ignores ordinary Markdown link labels when reconciling citations", async () => {
  const atlas = await createAtlas();
  await writeFile(
    path.join(atlas, "warm-minimal", "field-guide.md"),
    "# Field guide\n\nEvidence [source-1]. Read the [field-guide](https://example.test/guide).",
  );

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "success");
});

test("atlas validator recognizes unhyphenated source IDs in field-guide citations", async () => {
  const atlas = await createAtlas();
  const packRoot = path.join(atlas, "warm-minimal");
  const sourcesPath = path.join(packRoot, "sources.json");
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  sources.sources[0].id = "source1";
  await writeFile(sourcesPath, JSON.stringify(sources, null, 2));
  const packPath = path.join(packRoot, "style-pack.json");
  const pack = JSON.parse(await readFile(packPath, "utf8"));
  pack.source_ids[0] = "source1";
  await writeFile(packPath, JSON.stringify(pack, null, 2));
  const visualsPath = path.join(packRoot, "visuals.json");
  const visuals = JSON.parse(await readFile(visualsPath, "utf8"));
  for (const visual of visuals.visuals) visual.source_id = "source1";
  await writeFile(visualsPath, JSON.stringify(visuals, null, 2));
  await writeFile(
    path.join(packRoot, "field-guide.md"),
    "# Field guide\n\nEvidence [source1].",
  );

  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "success");
});

test("atlas validator reports invalid source count, license, hash, and references", async () => {
  const atlas = await createAtlas();
  const pack = path.join(atlas, "warm-minimal");
  const sourcesPath = path.join(pack, "sources.json");
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  sources.sources = sources.sources.slice(0, 24);
  await writeFile(sourcesPath, JSON.stringify(sources));
  const visualsPath = path.join(pack, "visuals.json");
  const visuals = JSON.parse(await readFile(visualsPath, "utf8"));
  visuals.visuals[0].license = "All rights reserved";
  visuals.visuals[0].sha256 = "not-a-real-hash";
  visuals.visuals[0].source_id = "missing-source";
  await writeFile(visualsPath, JSON.stringify(visuals));
  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const codes = JSON.parse(result.stdout).errors.map((item) => item.code);
  for (const code of ["invalid_source_count", "invalid_license", "hash_mismatch", "unknown_source_reference"]) {
    assert.equal(codes.includes(code), true, `${code} missing`);
  }
});

test("atlas validator rejects an impossible pack review date", async () => {
  const atlas = await createAtlas();
  const packPath = path.join(atlas, "warm-minimal", "style-pack.json");
  const pack = JSON.parse(await readFile(packPath, "utf8"));
  pack.reviewed_at = "2026-02-30";
  await writeFile(packPath, JSON.stringify(pack, null, 2));
  const result = run(validateScript, ["--atlas", atlas, "--json"], atlas);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(
    JSON.parse(result.stdout).errors.some((item) => item.code === "invalid_review_date"),
    true,
  );
});
