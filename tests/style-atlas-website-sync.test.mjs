import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("website/scripts/sync-style-atlas.mjs");
const imageBytes = Buffer.from("roomfile-style-atlas-test-image");

function run(args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
}

async function fixture(overrides = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "roomfile-web-atlas-"));
  const atlas = path.join(root, "atlas");
  const packRoot = path.join(atlas, "styles/test-style");
  const imageRoot = path.join(packRoot, "images");
  const outputData = path.join(root, "generated/style-atlas.json");
  const outputAssets = path.join(root, "public/styles");
  await mkdir(imageRoot, { recursive: true });
  await writeFile(path.join(imageRoot, "plate.jpg"), imageBytes);

  const visual = {
    id: "T-V1",
    source_id: "T-A1",
    path: "images/plate.jpg",
    original_url: "https://upload.wikimedia.org/example.jpg",
    source_page: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    creator: "Test Creator",
    work_title: "Test Interior",
    work_date: "1960",
    institution: "Test Museum",
    license: "CC-BY-4.0",
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "Test Creator, Test Interior, Test Museum, CC-BY-4.0.",
    retrieved_at: "2026-07-19",
    derivative: "Test-only unchanged bytes.",
    byte_size: imageBytes.byteLength,
    width: 4,
    height: 3,
    sha256: createHash("sha256").update(imageBytes).digest("hex"),
    alt: "A test interior plate.",
    caption: "A caption preserved from the Atlas.",
    what_to_notice: "Notice the spatial hierarchy.",
    what_not_to_generalize: "Do not treat this as a preset.",
    context: "historic_core",
    ...overrides.visual,
  };
  const source = {
    id: "T-A1",
    title: "Museum source",
    publisher: "Test Museum",
    url: "https://example.com/source",
    tier: 1,
    kind: "historical",
    retrieved_at: "2026-07-19",
    supports: "The test historical claim.",
  };
  const index = {
    schema_version: "0.3.0",
    purpose: "A researched lens, not a preset.",
    packs: [
      {
        id: "test-style",
        name: "Test Style",
        aliases: ["TS"],
        path: "styles/test-style",
        version: "0.3.0",
      },
    ],
  };
  const manifest = {
    schema_version: "0.3.0",
    id: "test-style",
    version: "0.3.0",
    reviewed_at: "2026-07-19",
    files: [
      "manifest.json",
      "style-pack.json",
      "quick-guide.md",
      "field-guide.md",
      "signals.json",
      "sources.json",
      "visuals.json",
      "ATTRIBUTION.md",
    ],
    images: overrides.manifestImages ?? ["images/plate.jpg"],
    counts: { sources: 1, visuals: 1 },
  };
  const signals = {
    schema_version: "0.3.0",
    id: "test-style",
    historical_core: ["Historical core signal."],
    current_expressions: ["Current expression signal."],
    composition: ["Composition signal."],
    furniture_forms: ["Furniture signal."],
    materials: ["Material signal."],
    palette: ["Palette signal."],
    lighting: ["Lighting signal."],
    textiles_art: ["Textile signal."],
    spatial_density: ["Density signal."],
    variants: ["Variant signal."],
    adjacent_styles: ["Adjacent style."],
    questions: ["What should this room feel like?"],
    cliches_to_avoid: ["Preset thinking."],
    positive_prompt_guidance: ["Preserve user evidence."],
    negative_prompt_guidance: ["Avoid generic styling."],
  };

  await Promise.all([
    writeFile(path.join(atlas, "index.json"), `${JSON.stringify(index, null, 2)}\n`),
    writeFile(path.join(packRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(
      path.join(packRoot, "style-pack.json"),
      `${JSON.stringify({
        schema_version: "0.3.0",
        id: "test-style",
        name: "Test Style",
        aliases: ["TS"],
        version: "0.3.0",
        reviewed_at: "2026-07-19",
        source_ids: ["T-A1"],
        visual_ids: ["T-V1"],
      }, null, 2)}\n`,
    ),
    writeFile(
      path.join(packRoot, "quick-guide.md"),
      "# Test Style: quick guide\n\n## Definition\n\nA concise definition led by user evidence.\n\n## Questions to ask the user\n\nWhat matters here?\n",
    ),
    writeFile(
      path.join(packRoot, "field-guide.md"),
      [
        "# Test Style: field guide",
        "## Origins",
        "Historical core text [T-A1].",
        "## Design logic",
        "Design logic text [T-A1].",
        "## Current expressions",
        "Current expression text [T-A1].",
        "## Room translation",
        "Room translation text [T-A1].",
        "## Misreadings",
        "Misreading text [T-A1].",
      ].join("\n\n"),
    ),
    writeFile(path.join(packRoot, "signals.json"), `${JSON.stringify(signals, null, 2)}\n`),
    writeFile(
      path.join(packRoot, "sources.json"),
      `${JSON.stringify({ schema_version: "0.3.0", sources: [source] }, null, 2)}\n`,
    ),
    writeFile(
      path.join(packRoot, "visuals.json"),
      `${JSON.stringify({ schema_version: "0.3.0", visuals: [visual] }, null, 2)}\n`,
    ),
    writeFile(
      path.join(packRoot, "ATTRIBUTION.md"),
      "# Attribution\n\nTest Creator, Test Interior, Test Museum, CC-BY-4.0.\n",
    ),
  ]);

  return { atlas, outputData, outputAssets, packRoot, root };
}

function argsFor(paths, extra = []) {
  return [
    "--atlas",
    paths.atlas,
    "--output-data",
    paths.outputData,
    "--output-assets",
    paths.outputAssets,
    ...extra,
  ];
}

test("sync deterministically generates website data and preserves attribution", async () => {
  const paths = await fixture();
  const first = run(argsFor(paths));
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const firstData = await readFile(paths.outputData);
  const firstImage = await readFile(
    path.join(paths.outputAssets, "test-style/t-v1-plate.jpg"),
  );
  const generated = JSON.parse(firstData);
  assert.equal(generated.packs[0].visuals[0].attribution, "Test Creator, Test Interior, Test Museum, CC-BY-4.0.");
  assert.equal(generated.packs[0].visuals[0].license, "CC-BY-4.0");
  assert.equal(generated.packs[0].visuals[0].public_path, "/styles/test-style/t-v1-plate.jpg");
  assert.deepEqual(firstImage, imageBytes);

  const second = run(argsFor(paths));
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.deepEqual(await readFile(paths.outputData), firstData);
});

test("--check detects changed, missing, and extra committed output", async () => {
  const paths = await fixture();
  assert.equal(run(argsFor(paths)).status, 0);
  assert.equal(run(argsFor(paths, ["--check"])).status, 0);

  await writeFile(paths.outputData, "{}\n");
  const drift = run(argsFor(paths, ["--check"]));
  assert.equal(drift.status, 1);
  assert.match(`${drift.stdout}\n${drift.stderr}`, /drift|changed/i);

  assert.equal(run(argsFor(paths)).status, 0);
  await writeFile(path.join(paths.outputAssets, "extra.jpg"), "extra");
  const extra = run(argsFor(paths, ["--check"]));
  assert.equal(extra.status, 1);
  assert.match(`${extra.stdout}\n${extra.stderr}`, /extra\.jpg|extra/i);
});

test("sync rejects traversing and undeclared image paths", async () => {
  const traversal = await fixture({
    visual: { path: "../escape.jpg" },
    manifestImages: ["../escape.jpg"],
  });
  const traversing = run(argsFor(traversal));
  assert.equal(traversing.status, 2);
  assert.match(`${traversing.stdout}\n${traversing.stderr}`, /travers|invalid image path/i);

  const unknown = await fixture({ manifestImages: ["images/other.jpg"] });
  const undeclared = run(argsFor(unknown));
  assert.equal(undeclared.status, 2);
  assert.match(`${undeclared.stdout}\n${undeclared.stderr}`, /undeclared|unknown image/i);
});

test("sync rejects missing attribution and non-allowlisted licenses", async () => {
  const missing = await fixture({ visual: { attribution: "" } });
  const missingResult = run(argsFor(missing));
  assert.equal(missingResult.status, 2);
  assert.match(`${missingResult.stdout}\n${missingResult.stderr}`, /attribution/i);

  const forbidden = await fixture({ visual: { license: "All rights reserved" } });
  const licenseResult = run(argsFor(forbidden));
  assert.equal(licenseResult.status, 2);
  assert.match(`${licenseResult.stdout}\n${licenseResult.stderr}`, /license/i);
});

test("sync rejects a pack id that could escape the public output directory", async () => {
  const paths = await fixture();
  const indexPath = path.join(paths.atlas, "index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  index.packs[0].id = "../escape";
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  for (const file of ["manifest.json", "style-pack.json", "signals.json"]) {
    const target = path.join(paths.packRoot, file);
    const data = JSON.parse(await readFile(target, "utf8"));
    data.id = "../escape";
    await writeFile(target, `${JSON.stringify(data, null, 2)}\n`);
  }

  const result = run(argsFor(paths));
  assert.equal(result.status, 2);
  assert.match(`${result.stdout}\n${result.stderr}`, /pack id|invalid.*id|travers/i);
});
