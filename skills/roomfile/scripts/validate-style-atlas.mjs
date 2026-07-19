#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { failInput, parseArgs, printResult, result } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  if (!args.atlas) throw new Error("--atlas is required");
  const atlas = path.resolve(String(args.atlas));
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
    pack: path.join(root, "style-pack.json"),
    sources: path.join(root, "sources.json"),
    visuals: path.join(root, "visuals.json"),
  };
  let pack;
  let sources;
  let visuals;
  try {
    pack = await readRequiredJson(files.pack, artifacts);
    sources = await readRequiredJson(files.sources, artifacts);
    visuals = await readRequiredJson(files.visuals, artifacts);
  } catch (error) {
    if (error?.kind === "malformed") throw error;
    issue(errors, "missing_required_file", error instanceof Error ? error.message : String(error), declared.id);
    return;
  }
  for (const [name, value] of Object.entries({ pack, sources, visuals })) {
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
  const sourceIds = ids(sourceList, "source", errors, declared.id);
  const visualIds = ids(visualList, "visual", errors, declared.id);
  const tierOne = sourceList.filter((source) => Number(source?.tier) === 1).length;
  const contemporary = sourceList.filter((source) => source?.kind === "contemporary").length;
  const critical = sourceList.filter((source) => source?.kind === "critical").length;
  if (tierOne < 8) issue(errors, "insufficient_tier_1_sources", "Each pack needs at least 8 tier-1 sources.", declared.id);
  if (contemporary < 5) issue(errors, "insufficient_contemporary_sources", "Each pack needs at least 5 contemporary sources.", declared.id);
  if (critical < 3) issue(errors, "insufficient_critical_sources", "Each pack needs at least 3 critical sources.", declared.id);
  for (const id of pack.source_ids ?? []) if (!sourceIds.has(id)) issue(errors, "unknown_source_reference", `Pack references missing source ${id}.`, declared.id);
  for (const id of pack.visual_ids ?? []) if (!visualIds.has(id)) issue(errors, "unknown_visual_reference", `Pack references missing visual ${id}.`, declared.id);
  for (const visual of visualList) await validateVisual(root, visual, sourceIds, errors, artifacts, declared.id);
}

async function validateVisual(root, visual, sourceIds, errors, artifacts, packId) {
  const id = visual?.id || "unknown";
  if (!sourceIds.has(visual?.source_id)) issue(errors, "unknown_source_reference", `Visual ${id} references an unknown source.`, packId, id);
  if (!new Set(["CC0-1.0", "PDM-1.0", "CC-BY-4.0"]).has(visual?.license)) issue(errors, "invalid_license", `Visual ${id} has a non-allowlisted license.`, packId, id);
  for (const field of ["alt", "caption", "what_to_notice", "what_not_to_generalize"]) {
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

function validVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value);
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
