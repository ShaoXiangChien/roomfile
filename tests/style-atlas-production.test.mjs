import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const skillRoot = path.resolve("skills/roomfile");
const atlasRoot = path.join(skillRoot, "references/style-atlas");
const styleRoot = path.join(atlasRoot, "styles");
const rootAtlas = path.resolve("references/style-atlas");
const validateScript = path.join(skillRoot, "scripts/validate-style-atlas.mjs");
const resolveScript = path.join(skillRoot, "scripts/resolve-style.mjs");
const requiredPackFiles = [
  "manifest.json",
  "style-pack.json",
  "quick-guide.md",
  "field-guide.md",
  "signals.json",
  "sources.json",
  "visuals.json",
  "ATTRIBUTION.md",
  "images",
];
const requiredSignals = [
  "historical_core",
  "current_expressions",
  "composition",
  "furniture_forms",
  "materials",
  "palette",
  "lighting",
  "textiles_art",
  "spatial_density",
  "variants",
  "adjacent_styles",
  "questions",
  "cliches_to_avoid",
  "positive_prompt_guidance",
  "negative_prompt_guidance",
];
const expected = new Map([
  ["mid-century-modern", { sources: 30, visuals: 12 }],
  ["bauhaus", { sources: 30, visuals: 12 }],
  ["japandi", { sources: 33, visuals: 12 }],
]);
const allowedLicenses = new Set(["CC0-1.0", "PDM-1.0", "CC-BY-4.0"]);

function run(script, args = [], cwd = path.resolve(".")) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
}

function words(markdown) {
  return markdown
    .replaceAll(/https?:\/\/\S+/g, " ")
    .replaceAll(/[`#>*_[\]()|]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

async function json(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

test("the portable skill contains the only authoritative Style Atlas", async () => {
  await access(path.join(atlasRoot, "index.json"));
  await access(path.join(atlasRoot, "schemas/style-pack.schema.json"));
  await access(path.join(atlasRoot, "schemas/style-context.schema.json"));
  await access(path.join(atlasRoot, "CONTRIBUTING.md"));
  await assert.rejects(access(rootAtlas), /ENOENT/);
});

test("the production Atlas declares exactly the three complete style packs", async () => {
  const index = await json(path.join(atlasRoot, "index.json"));
  assert.equal(index.schema_version, "0.3.0");
  assert.deepEqual(index.packs.map(({ id }) => id).sort(), [...expected.keys()].sort());

  for (const entry of index.packs) {
    assert.equal(entry.path, `styles/${entry.id}`);
    const packRoot = path.join(atlasRoot, entry.path);
    for (const file of requiredPackFiles) await access(path.join(packRoot, file));
    const manifest = await json(path.join(packRoot, "manifest.json"));
    assert.equal(manifest.id, entry.id);
    assert.deepEqual([...manifest.files].sort(), requiredPackFiles.filter((item) => item !== "images").sort());
  }

  assert.deepEqual((await readdir(styleRoot)).sort(), [...expected.keys()].sort());
});

test("production source records preserve the full approved inventories and classifications", async () => {
  for (const [id, counts] of expected) {
    const root = path.join(styleRoot, id);
    const pack = await json(path.join(root, "style-pack.json"));
    const { sources } = await json(path.join(root, "sources.json"));
    assert.equal(sources.length, counts.sources, `${id} source count`);
    assert.equal(pack.source_ids.length, counts.sources, `${id} pack source references`);
    assert.deepEqual(pack.source_ids, sources.map((source) => source.id));
    assert.equal(sources.filter((source) => source.tier === 1).length >= 8, true);
    assert.equal(sources.filter((source) => source.kind === "contemporary").length >= 5, true);
    assert.equal(sources.filter((source) => source.kind === "critical").length >= 3, true);
    for (const source of sources) {
      for (const field of ["id", "title", "publisher", "url", "kind", "supports", "retrieved_at"]) {
        assert.equal(typeof source[field], "string", `${id}/${source.id} ${field}`);
        assert.notEqual(source[field].trim(), "", `${id}/${source.id} ${field}`);
      }
      assert.equal([1, 2, 3].includes(source.tier), true, `${id}/${source.id} tier`);
      assert.match(source.url, /^https?:\/\//);
      assert.match(source.retrieved_at, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});

test("production quick guides stay agent-usable and field guides remain evidence-led", async () => {
  for (const id of expected.keys()) {
    const root = path.join(styleRoot, id);
    const quick = await readFile(path.join(root, "quick-guide.md"), "utf8");
    const field = await readFile(path.join(root, "field-guide.md"), "utf8");
    const count = words(quick).length;
    assert.equal(count >= 800 && count <= 1200, true, `${id} quick guide has ${count} words`);
    for (const heading of [
      "Origins",
      "Design logic",
      "Spatial composition",
      "Furniture and forms",
      "Materials",
      "Palette",
      "Lighting",
      "Textiles and art",
      "Density",
      "Variants",
      "Current expressions",
      "Room translation",
      "Misreadings",
    ]) {
      assert.match(field, new RegExp(`^## ${heading}`, "m"), `${id} missing ${heading}`);
    }
    const prefix = id === "mid-century-modern" ? "M-" : id === "bauhaus" ? "B-" : "J-";
    assert.match(field, new RegExp(`\\[${prefix}[ABC]\\d+\\]`), `${id} needs source-id citations`);
    assert.doesNotMatch(`${quick}\n${field}`, /\b(style preset|preset recipe|style allowlist|allowed styles only)\b/i);
    assert.match(`${quick}\n${field}`, /user (?:inspiration|preferences?|reactions?).{0,80}(?:outweigh|outrank|override|take priority)/i);
  }
});

test("signals expose every required category without becoming fixed recipes", async () => {
  for (const id of expected.keys()) {
    const signals = await json(path.join(styleRoot, id, "signals.json"));
    assert.equal(signals.schema_version, "0.3.0");
    assert.equal(signals.id, id);
    for (const category of requiredSignals) {
      assert.equal(Array.isArray(signals[category]), true, `${id}/${category}`);
      assert.equal(signals[category].length > 0, true, `${id}/${category} is empty`);
    }
    assert.equal(signals.user_inspiration_priority, true);
    assert.equal(signals.lens_not_recipe, true);
  }
});

test("editorial truth distinguishes history, current usage, and common clichés", async () => {
  const mcm = `${await readFile(path.join(styleRoot, "mid-century-modern/quick-guide.md"), "utf8")}\n${await readFile(path.join(styleRoot, "mid-century-modern/field-guide.md"), "utf8")}`;
  assert.match(mcm, /postwar modernisms/i);
  assert.match(mcm, /contemporary (?:social )?usage/i);
  assert.match(mcm, /1970s-adjacent/i);
  assert.match(mcm, /(?:race|gender|labor|marketing)/i);
  assert.match(mcm, /Mad Men/i);

  const bauhaus = `${await readFile(path.join(styleRoot, "bauhaus/quick-guide.md"), "utf8")}\n${await readFile(path.join(styleRoot, "bauhaus/field-guide.md"), "utf8")}`;
  assert.match(bauhaus, /1919[–-]1933/);
  for (const term of ["pedagogy", "workshops", "politics", "weaving", "stage", "typography", "migration"]) {
    assert.match(bauhaus, new RegExp(term, "i"));
  }
  assert.match(bauhaus, /primary colors.{0,100}(?:thread|not.{0,30}definition)/i);

  const japandi = `${await readFile(path.join(styleRoot, "japandi/quick-guide.md"), "utf8")}\n${await readFile(path.join(styleRoot, "japandi/field-guide.md"), "utf8")}`;
  assert.match(japandi, /late-2010s\/2020s/);
  assert.match(japandi, /commercial\/editorial hybrid label/i);
  assert.match(japandi, /not (?:an )?(?:ancient|historic|historical) movement/i);
  assert.match(japandi, /Japanese and (?:Nordic|Scandinavian) antecedents.{0,80}(?:distinct|separate)/is);
  assert.doesNotMatch(japandi, /\bancient Japandi\b|\bhistoric(?:al)? Japandi (?:movement|tradition)\b/i);
});

test("all production visuals have allowlisted rights, complete provenance, and valid local files", async () => {
  for (const [id, counts] of expected) {
    const root = path.join(styleRoot, id);
    const pack = await json(path.join(root, "style-pack.json"));
    const { visuals } = await json(path.join(root, "visuals.json"));
    const attribution = await readFile(path.join(root, "ATTRIBUTION.md"), "utf8");
    assert.equal(visuals.length, counts.visuals, `${id} visual count`);
    assert.equal(pack.visual_ids.length, counts.visuals, `${id} pack visual references`);
    assert.deepEqual(pack.visual_ids, visuals.map((visual) => visual.id));
    for (const visual of visuals) {
      assert.equal(allowedLicenses.has(visual.license), true, `${id}/${visual.id} license`);
      for (const field of [
        "original_url",
        "source_page",
        "creator",
        "work_title",
        "work_date",
        "institution",
        "license_url",
        "attribution",
        "retrieved_at",
        "derivative",
        "sha256",
        "alt",
        "caption",
        "what_to_notice",
        "what_not_to_generalize",
      ]) {
        assert.equal(typeof visual[field], "string", `${id}/${visual.id} ${field}`);
        assert.notEqual(visual[field].trim(), "", `${id}/${visual.id} ${field}`);
      }
      assert.match(visual.original_url, /^https:\/\/upload\.wikimedia\.org\//);
      assert.match(visual.source_page, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      assert.match(visual.sha256, /^[a-f0-9]{64}$/);
      assert.match(visual.retrieved_at, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(Number.isInteger(visual.byte_size) && visual.byte_size > 0, true);
      assert.equal(Number.isInteger(visual.width) && visual.width > 0 && visual.width <= 1600, true);
      assert.equal(Number.isInteger(visual.height) && visual.height > 0 && visual.height <= 1600, true);
      const local = path.join(root, visual.path);
      assert.equal((await stat(local)).size, visual.byte_size);
      const section = attribution.match(
        new RegExp(`^## ${visual.id}\\b[\\s\\S]*?(?=^## |(?![\\s\\S]))`, "m"),
      )?.[0];
      assert.notEqual(section, undefined, `${id}/${visual.id} attribution section`);
      for (const field of [
        "creator",
        "work_title",
        "work_date",
        "institution",
        "license",
        "license_url",
        "source_page",
        "original_url",
        "attribution",
      ]) {
        assert.equal(section.includes(visual[field]), true, `${id}/${visual.id} attribution ${field}`);
      }
    }
    assert.equal((await readdir(path.join(root, "images"))).length, counts.visuals);
    assert.match(attribution, /CC BY 4\.0|public domain/i);
  }
});

test("Carlquist Katsura records preserve creator, repository, and DPLA-partner roles", async () => {
  const { visuals } = await json(path.join(styleRoot, "japandi/visuals.json"));
  for (const id of ["J-S1", "J-S2", "J-S3", "J-S4"]) {
    const visual = visuals.find((item) => item.id === id);
    assert.equal(visual.creator, "Sherwin John Carlquist", `${id} creator`);
    assert.equal(
      visual.institution,
      "Botanical Research Institute of Texas (repository); The Portal to Texas History (DPLA partner)",
      `${id} institution`,
    );
    assert.match(visual.attribution, /Botanical Research Institute of Texas/);
    assert.match(visual.attribution, /The Portal to Texas History \(DPLA partner\)/);
  }
});

test("every production alt describes observable image content instead of repeating interpretation", async () => {
  const interpretive = /\b(?:useful|helps? explain|supports?|evidence|context|definition|movement|style|usage|associated|relationship|path toward|reminder|complicates?|broadens?|dissemination|canonical|significant)\b/i;
  for (const id of expected.keys()) {
    const { visuals } = await json(path.join(styleRoot, id, "visuals.json"));
    for (const visual of visuals) {
      assert.equal(visual.alt.trim().split(/\s+/).length >= 8, true, `${id}/${visual.id} specific alt`);
      assert.doesNotMatch(visual.alt, interpretive, `${id}/${visual.id} interpretive alt`);
      assert.equal(
        visual.alt.toLowerCase().includes(visual.what_to_notice.toLowerCase()),
        false,
        `${id}/${visual.id} repeats what_to_notice`,
      );
    }
  }
});

test("production alts preserve verified color facts and omit nonexistent objects", async () => {
  const visuals = new Map();
  for (const style of expected.keys()) {
    const document = await json(path.join(styleRoot, style, "visuals.json"));
    for (const visual of document.visuals) visuals.set(visual.id, visual);
  }
  const colorVisuals = [
    "M-V3", "M-V4", "M-V5", "M-V6", "M-V7",
    "B-V5", "B-V7",
    "J-S1", "J-S2", "J-S3", "J-S4", "J-S5", "J-S6", "J-V1",
  ];
  for (const id of colorVisuals) {
    assert.doesNotMatch(visuals.get(id).alt, /\bblack-and-white\b/i, `${id} is a color image`);
  }
  for (const color of ["red", "black", "cream"]) {
    assert.match(visuals.get("B-V5").alt, new RegExp(`\\b${color}\\b`, "i"));
  }
  assert.match(visuals.get("B-V7").alt, /\b(?:yellow|tan)\b/i);
  for (const color of ["red", "gray", "black"]) {
    assert.match(visuals.get("B-V7").alt, new RegExp(`\\b${color}\\b`, "i"));
  }
  assert.doesNotMatch(visuals.get("M-V4").alt, /\bpiano\b/i);
});

test("known source publication dates are preserved", async () => {
  const { sources } = await json(path.join(styleRoot, "mid-century-modern/sources.json"));
  assert.equal(sources.find((source) => source.id === "M-A16").publication_date, "2013-06-17");
  assert.equal(sources.find((source) => source.id === "M-A17").publication_date, "2017-01-10");
});

test("Bauhaus visuals cover weaving and graphic pedagogy; Japandi visuals stay culturally precise", async () => {
  const bauhaus = await json(path.join(styleRoot, "bauhaus/visuals.json"));
  const media = new Set(bauhaus.visuals.flatMap((visual) => visual.medium_tags));
  assert.equal(media.has("weaving"), true);
  assert.equal(media.has("typography"), true);
  assert.equal(media.has("graphic-pedagogy"), true);

  const japandi = await json(path.join(styleRoot, "japandi/visuals.json"));
  const evidence = new Set(japandi.visuals.flatMap((visual) => visual.evidence_tags));
  for (const tag of ["interior", "craft", "screen", "textile", "ceramic"]) assert.equal(evidence.has(tag), true);
  assert.equal(new Set(japandi.visuals.map((visual) => visual.original_url)).size, 12);
  for (const visual of japandi.visuals) {
    assert.notEqual(visual.context, "historic_japandi");
    assert.doesNotMatch(`${visual.caption} ${visual.alt}`, /\bhistoric(?:al)? Japandi\b|\btraditional Japandi\b/i);
  }
});

test("the real Atlas validates and portable resolver defaults work outside the repository root", () => {
  const explicit = run(validateScript, ["--atlas", atlasRoot, "--json"]);
  assert.equal(explicit.status, 0, explicit.stderr || explicit.stdout);
  assert.equal(JSON.parse(explicit.stdout).status, "success");

  const portable = run(validateScript, ["--json"], path.dirname(skillRoot));
  assert.equal(portable.status, 0, portable.stderr || portable.stdout);
  assert.equal(JSON.parse(portable.stdout).status, "success");

  const resolved = run(resolveScript, ["--style", "MCM", "--json"], path.dirname(skillRoot));
  assert.equal(resolved.status, 0, resolved.stderr || resolved.stdout);
  assert.equal(JSON.parse(resolved.stdout).pack.id, "mid-century-modern");
});

test("the contributor checklist protects evidence, attribution, and user agency", async () => {
  const guide = await readFile(path.join(atlasRoot, "CONTRIBUTING.md"), "utf8");
  for (const phrase of [
    "source tier",
    "critical sources",
    "direct-original",
    "license",
    "SHA-256",
    "alt text",
    "what not to generalize",
    "unknown styles",
    "user inspiration",
    "privacy",
  ]) {
    assert.match(guide, new RegExp(phrase, "i"));
  }
});
