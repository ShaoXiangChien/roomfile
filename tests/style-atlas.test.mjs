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

async function createAtlas() {
  const atlas = await mkdtemp(path.join(tmpdir(), "roomfile-atlas-"));
  const packs = [
    { id: "warm-minimal", name: "Warm Minimal", aliases: ["warm-minimalism"] },
    { id: "soft-industrial", name: "Soft Industrial", aliases: ["soft industrial style"] },
    { id: "coastal-modern", name: "Coastal Modern", aliases: ["coastal"] },
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
    url: `https://example.test/${pack.id}/${index + 1}`,
    tier: index < 8 ? 1 : 2,
    kind: index < 5 ? "contemporary" : index < 8 ? "critical" : "reference",
  }));
  const visuals = [];
  for (let index = 0; index < 12; index += 1) {
    const file = `images/${index + 1}.jpg`;
    const bytes = `image-${pack.id}-${index}`;
    await writeFile(path.join(directory, file), bytes);
    visuals.push({
      id: `visual-${index + 1}`,
      source_id: "source-1",
      path: file,
      license: "CC0-1.0",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      alt: `Alt ${index + 1}`,
      caption: `Caption ${index + 1}`,
      what_to_notice: "Notice this material relationship.",
      what_not_to_generalize: "Do not generalize it to every room.",
    });
  }
  await writeFile(path.join(directory, "style-pack.json"), JSON.stringify({
    schema_version: "0.3.0", id: pack.id, name: pack.name, aliases: pack.aliases,
    version: "0.3.0", reviewed_at: "2026-07-19", source_ids: ["source-1"], visual_ids: ["visual-1"],
  }, null, 2));
  await writeFile(path.join(directory, "sources.json"), JSON.stringify({ schema_version: "0.3.0", sources }, null, 2));
  await writeFile(path.join(directory, "visuals.json"), JSON.stringify({ schema_version: "0.3.0", visuals }, null, 2));
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

test("atlas validator accepts a complete three-pack atlas", async () => {
  const atlas = await createAtlas();
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
