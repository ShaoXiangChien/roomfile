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
  let attribution;
  try {
    manifest = await readRequiredJson(files.manifest, artifacts);
    pack = await readRequiredJson(files.pack, artifacts);
    quick = await readRequiredText(files.quick, artifacts);
    field = await readRequiredText(files.field, artifacts);
    signals = await readRequiredJson(files.signals, artifacts);
    sources = await readRequiredJson(files.sources, artifacts);
    visuals = await readRequiredJson(files.visuals, artifacts);
    attribution = await readRequiredText(files.attribution, artifacts);
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
  if (
    Array.isArray(pack.source_ids)
    && Array.isArray(pack.visual_ids)
    && (
      !coversInventory(pack.source_ids, sourceIds)
      || !coversInventory(pack.visual_ids, visualIds)
    )
  ) {
    issue(
      errors,
      "incomplete_pack_references",
      "Pack source_ids and visual_ids must cover their complete inventories exactly once.",
      declared.id,
    );
  }
  const citations = fieldGuideCitations(field, sourceIds);
  if (!citations.known.size) {
    issue(errors, "missing_field_guide_citations", "Field guide must cite this pack's source IDs.", declared.id);
  }
  for (const citation of citations.unknown) {
    issue(
      errors,
      "unknown_field_guide_citation",
      `Field guide cites missing source ${citation}.`,
      declared.id,
    );
  }
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
  for (const visual of visualList) {
    validateVisualAttribution(attribution, visual, errors, declared.id);
    await validateVisual(root, visual, sourceIds, errors, artifacts, declared.id);
  }
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
  let bytes;
  try {
    bytes = await readFile(imagePath);
    artifacts.push(imagePath);
  } catch {
    issue(errors, "missing_image_file", `Visual ${id} image file does not exist.`, packId, id);
    return;
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (visual.sha256 !== actual) issue(errors, "hash_mismatch", `Visual ${id} SHA-256 does not match its image.`, packId, id);
  if (visual.byte_size !== bytes.byteLength) issue(errors, "byte_size_mismatch", `Visual ${id} byte size does not match its image.`, packId, id);
  const declaredDimensionsValid = (
    Number.isInteger(visual.width)
    && Number.isInteger(visual.height)
    && visual.width > 0
    && visual.height > 0
    && visual.width <= 1600
    && visual.height <= 1600
  );
  if (!declaredDimensionsValid) {
    issue(errors, "invalid_image_dimensions", `Visual ${id} needs positive dimensions capped at 1600 px.`, packId, id);
  }
  let parsed;
  try {
    parsed = jpegStructure(bytes);
  } catch {
    issue(
      errors,
      "malformed_image",
      `Visual ${id} is not a structurally valid JPEG with a frame, scan data, and EOI marker.`,
      packId,
      id,
    );
    return;
  }
  if (parsed.width > 1600 || parsed.height > 1600) {
    issue(errors, "invalid_image_dimensions", `Visual ${id} JPEG frame dimensions exceed the 1600 px cap.`, packId, id);
  }
  if (
    Number.isInteger(visual.width)
    && Number.isInteger(visual.height)
    && (visual.width !== parsed.width || visual.height !== parsed.height)
  ) {
    issue(
      errors,
      "image_dimension_mismatch",
      `Visual ${id} records ${visual.width} × ${visual.height}px but its JPEG frame is ${parsed.width} × ${parsed.height}px.`,
      packId,
      id,
    );
  }
}

function validateVisualAttribution(markdown, visual, errors, packId) {
  const id = visual?.id || "unknown";
  const section = attributionSection(markdown, id);
  const required = [
    "creator",
    "work_title",
    "work_date",
    "institution",
    "license",
    "license_url",
    "source_page",
    "original_url",
    "attribution",
  ];
  const missing = !section
    ? required
    : required.filter((field) => typeof visual?.[field] !== "string" || !section.includes(visual[field]));
  if (missing.length) {
    issue(
      errors,
      "missing_visual_attribution",
      `ATTRIBUTION.md section for ${id} is missing: ${missing.join(", ")}.`,
      packId,
      id,
    );
  }
}

function attributionSection(markdown, id) {
  const heading = new RegExp(`^##\\s+${escapeRegExp(id)}\\b.*$`, "m");
  const match = heading.exec(markdown);
  if (!match) return "";
  const rest = markdown.slice(match.index);
  const next = rest.slice(match[0].length).search(/^##\s+/m);
  return next < 0 ? rest : rest.slice(0, match[0].length + next);
}

function jpegStructure(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Missing JPEG start-of-image marker.");
  }
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;
  let frame;
  let sawScan = false;
  let sawEndOfImage = false;
  while (offset < bytes.length) {
    const parsedMarker = jpegMarker(bytes, offset);
    const marker = parsedMarker.marker;
    offset = parsedMarker.afterMarker;
    if (marker === 0xd9) {
      if (!frame || !sawScan) throw new Error("JPEG ended before its frame and scan.");
      sawEndOfImage = true;
      break;
    }
    if (marker === 0xd8 || marker === 0x00) throw new Error("Unexpected JPEG marker.");
    if (marker >= 0xd0 && marker <= 0xd7) throw new Error("Restart marker outside scan data.");
    if (marker === 0x01) continue;
    const segment = jpegSegment(bytes, offset);
    if (startOfFrame.has(marker)) {
      if (frame) throw new Error("JPEG contains multiple frames.");
      frame = jpegFrame(bytes, offset, segment.length, marker);
      offset = segment.end;
      continue;
    }
    if (marker === 0xda) {
      if (!frame) throw new Error("JPEG scan precedes its frame.");
      validateJpegScan(bytes, offset, segment.length, frame);
      const entropy = jpegEntropyData(bytes, segment.end);
      if (!entropy.hasData) throw new Error("JPEG scan has no entropy-coded payload.");
      sawScan = true;
      offset = entropy.nextMarker;
      continue;
    }
    offset = segment.end;
  }
  if (!frame) throw new Error("JPEG frame not found.");
  if (!sawScan) throw new Error("JPEG scan not found.");
  if (!sawEndOfImage) throw new Error("JPEG end-of-image marker not found after scan data.");
  return { width: frame.width, height: frame.height };
}

function jpegMarker(bytes, offset) {
  const markerStart = offset;
  if (bytes[offset] !== 0xff) throw new Error("Invalid JPEG marker.");
  while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
  if (offset >= bytes.length) throw new Error("Truncated JPEG marker.");
  return { marker: bytes[offset], markerStart, afterMarker: offset + 1 };
}

function jpegSegment(bytes, offset) {
  if (offset + 2 > bytes.length) throw new Error("Truncated JPEG segment.");
  const length = bytes.readUInt16BE(offset);
  if (length < 2 || offset + length > bytes.length) throw new Error("Invalid JPEG segment length.");
  return { length, end: offset + length };
}

function jpegFrame(bytes, offset, length, marker) {
  if (length < 11) throw new Error("JPEG frame lacks a component table.");
  const precision = bytes[offset + 2];
  const height = bytes.readUInt16BE(offset + 3);
  const width = bytes.readUInt16BE(offset + 5);
  const componentCount = bytes[offset + 7];
  if (![8, 12].includes(precision) || width < 1 || height < 1) {
    throw new Error("Invalid JPEG frame dimensions or precision.");
  }
  if (componentCount < 1 || componentCount > 4 || length !== 8 + (3 * componentCount)) {
    throw new Error("Invalid JPEG frame component table.");
  }
  const components = new Set();
  for (let index = 0; index < componentCount; index += 1) {
    const start = offset + 8 + (index * 3);
    const id = bytes[start];
    const sampling = bytes[start + 1];
    const horizontalSampling = sampling >> 4;
    const verticalSampling = sampling & 0x0f;
    const quantizationTable = bytes[start + 2];
    if (
      components.has(id)
      || horizontalSampling < 1
      || horizontalSampling > 4
      || verticalSampling < 1
      || verticalSampling > 4
      || quantizationTable > 3
    ) {
      throw new Error("Invalid JPEG frame component.");
    }
    components.add(id);
  }
  return { marker, width, height, components };
}

function validateJpegScan(bytes, offset, length, frame) {
  if (length < 8) throw new Error("JPEG scan lacks a component table.");
  const componentCount = bytes[offset + 2];
  if (
    componentCount < 1
    || componentCount > frame.components.size
    || length !== 6 + (2 * componentCount)
  ) {
    throw new Error("Invalid JPEG scan component table.");
  }
  const selectors = new Set();
  for (let index = 0; index < componentCount; index += 1) {
    const start = offset + 3 + (index * 2);
    const id = bytes[start];
    const tables = bytes[start + 1];
    if (
      !frame.components.has(id)
      || selectors.has(id)
      || (tables >> 4) > 3
      || (tables & 0x0f) > 3
    ) {
      throw new Error("Invalid JPEG scan component selector.");
    }
    selectors.add(id);
  }
  const parameters = offset + 3 + (2 * componentCount);
  const spectralStart = bytes[parameters];
  const spectralEnd = bytes[parameters + 1];
  const approximation = bytes[parameters + 2];
  if (
    spectralStart > spectralEnd
    || spectralEnd > 63
    || (approximation >> 4) > 13
    || (approximation & 0x0f) > 13
  ) {
    throw new Error("Invalid JPEG scan parameters.");
  }
  if (
    frame.marker !== 0xc2
    && (spectralStart !== 0 || spectralEnd !== 63 || approximation !== 0)
  ) {
    throw new Error("Invalid sequential JPEG scan parameters.");
  }
}

function jpegEntropyData(bytes, offset) {
  let hasData = false;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      hasData = true;
      offset += 1;
      continue;
    }
    const markerStart = offset;
    offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) throw new Error("Truncated JPEG scan marker.");
    const marker = bytes[offset];
    if (marker === 0x00) {
      hasData = true;
      offset += 1;
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 1;
      continue;
    }
    return { hasData, nextMarker: markerStart };
  }
  throw new Error("JPEG scan is truncated.");
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

function coversInventory(references, inventory) {
  return references.length === inventory.size && new Set(references).size === inventory.size
    && references.every((id) => inventory.has(id));
}

function fieldGuideCitations(markdown, sourceIds) {
  const known = new Set();
  const unknown = new Set();
  for (const match of markdown.matchAll(/\[([^\]\r\n]+)\]/g)) {
    if (match.index > 0 && markdown[match.index - 1] === "!") continue;
    let cursor = match.index + match[0].length;
    while (cursor < markdown.length && /[ \t]/.test(markdown[cursor])) cursor += 1;
    if (markdown[cursor] === "(" || markdown[cursor] === "[") continue;
    const citation = match[1].trim();
    if (!citation) continue;
    (sourceIds.has(citation) ? known : unknown).add(citation);
  }
  return { known, unknown };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
