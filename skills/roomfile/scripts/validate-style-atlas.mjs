#!/usr/bin/env node
import { access, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { failInput, parseArgs, printResult, result } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultAtlas = path.resolve(scriptDirectory, "../references/style-atlas");
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
const productionSourceCounts = new Map([
  ["mid-century-modern", 30],
  ["bauhaus", 30],
  ["japandi", 33],
]);

try {
  const atlas = path.resolve(String(args.atlas || defaultAtlas));
  await access(atlas);
  const output = await validate(atlas);
  printResult(output, asJson);
  process.exitCode = output.status === "success" ? 0 : 1;
} catch (error) {
  failInput(error, asJson);
}

async function validate(atlas) {
  const errors = [];
  const warnings = [];
  const artifacts = [];
  const indexPath = path.join(atlas, "index.json");
  const index = await readRequiredJson(indexPath, artifacts);
  const declared = index?.packs;
  if (!Array.isArray(declared)) throw new Error(`${indexPath} must contain a packs array`);
  if (declared.length !== 3) {
    issue(errors, "invalid_pack_count", "Atlas must declare exactly three style-pack directories.");
  }
  const packIds = new Set();
  const directories = new Set();
  for (const entry of declared) {
    if (!entry || typeof entry.id !== "string" || !entry.id.trim()) {
      issue(errors, "invalid_pack_id", "Each declared pack needs a nonempty id.");
      continue;
    }
    if (packIds.has(entry.id)) {
      issue(errors, "duplicate_pack_id", `Duplicate pack id ${entry.id}.`);
    }
    packIds.add(entry.id);
    const directory = String(entry.path || entry.directory || entry.id);
    if (directories.has(directory)) {
      issue(errors, "duplicate_pack_directory", `Duplicate pack directory ${directory}.`);
    }
    directories.add(directory);
    await validatePack(atlas, directory, entry, errors, artifacts);
  }
  return result(errors.length ? "invalid" : "success", errors, warnings, artifacts);
}

async function validatePack(atlas, directory, declared, errors, artifacts) {
  if (path.isAbsolute(directory) || directory.split(path.sep).includes("..")) {
    issue(errors, "invalid_pack_directory", `Invalid pack directory ${directory}.`, declared.id);
    return;
  }
  const root = path.join(atlas, directory);
  const files = {
    manifest: path.join(root, "manifest.json"),
    pack: path.join(root, "style-pack.json"),
    quick: path.join(root, "quick-guide.md"),
    field: path.join(root, "field-guide.md"),
    signals: path.join(root, "signals.json"),
    sources: path.join(root, "sources.json"),
    visuals: path.join(root, "visuals.json"),
    attribution: path.join(root, "ATTRIBUTION.md"),
  };
  let manifest;
  let pack;
  let quick;
  let field;
  let signals;
  let sources;
  let visuals;
  try {
    manifest = await readRequiredJson(files.manifest, artifacts);
    pack = await readRequiredJson(files.pack, artifacts);
    quick = await readRequiredText(files.quick, artifacts);
    field = await readRequiredText(files.field, artifacts);
    signals = await readRequiredJson(files.signals, artifacts);
    sources = await readRequiredJson(files.sources, artifacts);
    visuals = await readRequiredJson(files.visuals, artifacts);
    await readRequiredText(files.attribution, artifacts);
    const imageDirectory = path.join(root, "images");
    if (!(await stat(imageDirectory)).isDirectory()) throw new Error(`Required directory is missing: ${imageDirectory}`);
    artifacts.push(imageDirectory);
  } catch (error) {
    if (error?.kind === "malformed") throw error;
    issue(errors, "missing_required_file", error instanceof Error ? error.message : String(error), declared.id);
    return;
  }
  for (const [name, value] of Object.entries({ pack, signals, sources, visuals })) {
    if (value?.schema_version !== "0.3.0") {
      issue(
        errors,
        "invalid_schema_version",
        `${name}.json must use schema version 0.3.0.`,
        declared.id,
      );
    }
  }
  if (pack.id !== declared.id) {
    issue(errors, "pack_id_mismatch", `Pack ${directory} must use declared id ${declared.id}.`, declared.id);
  }
  if (!validVersion(pack.version)) {
    issue(errors, "invalid_pack_version", "Pack version must be a semantic version.", declared.id);
  }
  if (!validDate(pack.reviewed_at)) {
    issue(errors, "invalid_review_date", "Pack must include an ISO review date.", declared.id);
  }
  if (!Array.isArray(pack.source_ids) || !Array.isArray(pack.visual_ids)) {
    issue(errors, "invalid_pack_references", "Pack must declare source_ids and visual_ids arrays.", declared.id);
  }
  const sourceList = Array.isArray(sources.sources) ? sources.sources : [];
  const visualList = Array.isArray(visuals.visuals) ? visuals.visuals : [];
  if (sourceList.length < 25 || sourceList.length > 40) issue(errors, "invalid_source_count", "Each pack needs 25 to 40 sources.", declared.id);
  if (visualList.length < 12 || visualList.length > 18) issue(errors, "invalid_visual_count", "Each pack needs 12 to 18 visuals.", declared.id);
  const productionSourceCount = productionSourceCounts.get(declared.id);
  if (productionSourceCount && sourceList.length !== productionSourceCount) {
    issue(errors, "invalid_production_source_count", `${declared.id} needs exactly ${productionSourceCount} sources.`, declared.id);
  }
  if (productionSourceCount && visualList.length !== 12) {
    issue(errors, "invalid_production_visual_count", `${declared.id} needs exactly 12 visuals.`, declared.id);
  }
  const guideWordCount = words(quick);
  if (guideWordCount < 800 || guideWordCount > 1200) {
    issue(errors, "invalid_quick_guide_length", `Quick guide must contain 800 to 1200 words; found ${guideWordCount}.`, declared.id);
  }
  if (!sourceCitation(declared.id).test(field)) {
    issue(errors, "missing_field_guide_citations", "Field guide must cite this pack's source IDs.", declared.id);
  }
  for (const category of requiredSignals) {
    if (!Array.isArray(signals?.[category]) || !signals[category].length) {
      issue(errors, "missing_signal_category", `signals.json needs a nonempty ${category} array.`, declared.id);
    }
  }
  if (signals?.id !== declared.id) issue(errors, "signal_id_mismatch", "signals.json id must match the pack id.", declared.id);
  if (manifest?.id !== declared.id || !Array.isArray(manifest?.files)) {
    issue(errors, "invalid_manifest", "manifest.json must identify the pack and declare its files.", declared.id);
  }
  const requiredFiles = ["manifest.json", "style-pack.json", "quick-guide.md", "field-guide.md", "signals.json", "sources.json", "visuals.json", "ATTRIBUTION.md"];
  for (const required of requiredFiles) {
    if (!manifest?.files?.includes(required)) issue(errors, "incomplete_manifest", `manifest.json must include ${required}.`, declared.id);
  }
  const sourceIds = ids(sourceList, "source", errors, declared.id);
  const visualIds = ids(visualList, "visual", errors, declared.id);
  const tierOne = sourceList.filter((source) => Number(source?.tier) === 1).length;
  const contemporary = sourceList.filter((source) => source?.kind === "contemporary").length;
  const critical = sourceList.filter((source) => source?.kind === "critical").length;
  if (tierOne < 8) issue(errors, "insufficient_tier_1_sources", "Each pack needs at least 8 tier-1 sources.", declared.id);
  if (contemporary < 5) issue(errors, "insufficient_contemporary_sources", "Each pack needs at least 5 contemporary sources.", declared.id);
  if (critical < 3) issue(errors, "insufficient_critical_sources", "Each pack needs at least 3 critical sources.", declared.id);
  for (const source of sourceList) {
    for (const fieldName of ["id", "title", "publisher", "url", "kind", "supports", "retrieved_at"]) {
      if (typeof source?.[fieldName] !== "string" || !source[fieldName].trim()) {
        issue(errors, "missing_source_metadata", `Source ${source?.id || "unknown"} needs nonempty ${fieldName}.`, declared.id);
      }
    }
  }
  for (const id of pack.source_ids ?? []) if (!sourceIds.has(id)) issue(errors, "unknown_source_reference", `Pack references missing source ${id}.`, declared.id);
  for (const id of pack.visual_ids ?? []) if (!visualIds.has(id)) issue(errors, "unknown_visual_reference", `Pack references missing visual ${id}.`, declared.id);
  for (const visual of visualList) await validateVisual(root, visual, sourceIds, errors, artifacts, declared.id);
}

async function validateVisual(root, visual, sourceIds, errors, artifacts, packId) {
  const id = visual?.id || "unknown";
  if (!sourceIds.has(visual?.source_id)) issue(errors, "unknown_source_reference", `Visual ${id} references an unknown source.`, packId, id);
  if (!new Set(["CC0-1.0", "PDM-1.0", "CC-BY-4.0"]).has(visual?.license)) issue(errors, "invalid_license", `Visual ${id} has a non-allowlisted license.`, packId, id);
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
    if (typeof visual?.[field] !== "string" || !visual[field].trim()) issue(errors, "missing_visual_annotation", `Visual ${id} needs nonempty ${field}.`, packId, id);
  }
  if (typeof visual?.path !== "string" || !visual.path || path.isAbsolute(visual.path) || visual.path.split(path.sep).includes("..")) {
    issue(errors, "invalid_image_path", `Visual ${id} has an invalid image path.`, packId, id);
    return;
  }
  const imagePath = path.join(root, visual.path);
  try {
    const bytes = await readFile(imagePath);
    artifacts.push(imagePath);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (visual.sha256 !== actual) issue(errors, "hash_mismatch", `Visual ${id} SHA-256 does not match its image.`, packId, id);
    if (visual.byte_size !== bytes.byteLength) issue(errors, "byte_size_mismatch", `Visual ${id} byte size does not match its image.`, packId, id);
    if (!Number.isInteger(visual.width) || !Number.isInteger(visual.height) || visual.width < 1 || visual.height < 1 || visual.width > 1600 || visual.height > 1600) {
      issue(errors, "invalid_image_dimensions", `Visual ${id} needs positive dimensions capped at 1600 px.`, packId, id);
    }
  } catch {
    issue(errors, "missing_image_file", `Visual ${id} image file does not exist.`, packId, id);
  }
}

function ids(values, kind, errors, packId) {
  const seen = new Set();
  for (const value of values) {
    if (typeof value?.id !== "string" || !value.id.trim() || seen.has(value.id)) issue(errors, `duplicate_${kind}_id`, `Each ${kind} needs a unique id.`, packId);
    else seen.add(value.id);
  }
  return seen;
}

function issue(errors, code, message, pack_id, visual_id) {
  errors.push({ code, message, ...(pack_id ? { pack_id } : {}), ...(visual_id ? { visual_id } : {}) });
}

async function readRequiredJson(file, artifacts) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    const error = new Error(`Required file is missing: ${file}`);
    error.kind = "missing";
    throw error;
  }
  try {
    const value = JSON.parse(text);
    artifacts.push(file);
    return value;
  } catch {
    const error = new Error(`Invalid JSON: ${file}`);
    error.kind = "malformed";
    throw error;
  }
}

async function readRequiredText(file, artifacts) {
  try {
    const text = await readFile(file, "utf8");
    artifacts.push(file);
    return text;
  } catch {
    const error = new Error(`Required file is missing: ${file}`);
    error.kind = "missing";
    throw error;
  }
}

function words(markdown) {
  return markdown
    .replaceAll(/https?:\/\/\S+/g, " ")
    .replaceAll(/[`#>*_[\]()|]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function sourceCitation(packId) {
  const prefix = packId === "mid-century-modern" ? "M" : packId === "bauhaus" ? "B" : packId === "japandi" ? "J" : "[A-Za-z0-9]";
  return new RegExp(`\\[${prefix}-[ABC]\\d+\\]`);
}

function validVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value);
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}
