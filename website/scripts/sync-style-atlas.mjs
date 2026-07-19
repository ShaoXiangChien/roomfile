#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedLicenses = new Set(["CC0-1.0", "PDM-1.0", "CC-BY-4.0"]);
const requiredVisualFields = [
  "id",
  "source_id",
  "path",
  "original_url",
  "source_page",
  "creator",
  "work_title",
  "work_date",
  "institution",
  "license",
  "license_url",
  "attribution",
  "retrieved_at",
  "derivative",
  "sha256",
  "alt",
  "caption",
  "what_to_notice",
  "what_not_to_generalize",
];
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(websiteRoot, "..");
const arguments_ = parseArguments(process.argv.slice(2));
const atlasRoot = path.resolve(
  arguments_.atlas
    ?? path.join(repositoryRoot, "skills/roomfile/references/style-atlas"),
);
const committedData = path.resolve(
  arguments_["output-data"]
    ?? path.join(websiteRoot, "app/generated/style-atlas.json"),
);
const committedAssets = path.resolve(
  arguments_["output-assets"]
    ?? path.join(websiteRoot, "public/styles"),
);

try {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "roomfile-style-atlas-sync-"),
  );
  const expectedData = path.join(temporaryRoot, "style-atlas.json");
  const expectedAssets = path.join(temporaryRoot, "styles");
  await generate({ atlasRoot, dataPath: expectedData, assetsRoot: expectedAssets });

  if (arguments_.check) {
    const drift = await compareOutput({
      expectedData,
      expectedAssets,
      committedData,
      committedAssets,
    });
    await rm(temporaryRoot, { recursive: true, force: true });
    if (drift.length) {
      process.stderr.write(
        `Style Atlas website output has drifted:\n${drift.map((item) => `- ${item}`).join("\n")}\nRun node website/scripts/sync-style-atlas.mjs to refresh it.\n`,
      );
      process.exitCode = 1;
    } else {
      process.stdout.write("Style Atlas website output is in sync.\n");
    }
  } else {
    await mkdir(path.dirname(committedData), { recursive: true });
    await mkdir(path.dirname(committedAssets), { recursive: true });
    await rm(committedData, { force: true });
    await rm(committedAssets, { recursive: true, force: true });
    await rename(expectedData, committedData);
    await rename(expectedAssets, committedAssets);
    await rm(temporaryRoot, { recursive: true, force: true });
    process.stdout.write(
      `Synchronized Style Atlas data and public image assets.\n`,
    );
  }
} catch (error) {
  process.stderr.write(
    `Style Atlas sync failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 2;
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      result.check = true;
      continue;
    }
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value`);
    }
    result[key] = value;
    index += 1;
  }
  return result;
}

async function generate({ atlasRoot: sourceRoot, dataPath, assetsRoot }) {
  const index = await readJson(path.join(sourceRoot, "index.json"));
  if (index?.schema_version !== "0.3.0" || !Array.isArray(index?.packs)) {
    throw new Error("Atlas index must use schema 0.3.0 and declare packs.");
  }
  await mkdir(path.dirname(dataPath), { recursive: true });
  await mkdir(assetsRoot, { recursive: true });

  const seenPackIds = new Set();
  const packs = [];
  for (const entry of index.packs) {
    requireText(entry?.id, "Every Atlas pack needs an id.");
    requireText(entry?.name, `Atlas pack ${entry.id} needs a name.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      throw new Error(`Atlas pack id ${entry.id} is invalid.`);
    }
    if (seenPackIds.has(entry.id)) {
      throw new Error(`Duplicate Atlas pack id: ${entry.id}`);
    }
    seenPackIds.add(entry.id);
    const packRelative = safeRelative(
      entry.path,
      `Pack ${entry.id} has an invalid or traversing path.`,
    );
    const packRoot = path.join(sourceRoot, packRelative);
    packs.push(
      await buildPack({
        entry,
        packRoot,
        assetsRoot,
      }),
    );
  }

  const artifact = {
    schema_version: "0.3.0",
    generated_from: "skills/roomfile/references/style-atlas",
    purpose: index.purpose,
    user_inspiration_priority: index.user_inspiration_priority,
    packs,
  };
  await writeFile(dataPath, `${JSON.stringify(artifact, null, 2)}\n`);
}

async function buildPack({ entry, packRoot, assetsRoot }) {
  const [manifest, pack, quick, field, signals, sourceData, visualData] =
    await Promise.all([
      readJson(path.join(packRoot, "manifest.json")),
      readJson(path.join(packRoot, "style-pack.json")),
      readFile(path.join(packRoot, "quick-guide.md"), "utf8"),
      readFile(path.join(packRoot, "field-guide.md"), "utf8"),
      readJson(path.join(packRoot, "signals.json")),
      readJson(path.join(packRoot, "sources.json")),
      readJson(path.join(packRoot, "visuals.json")),
    ]);
  if (
    manifest?.id !== entry.id
    || pack?.id !== entry.id
    || signals?.id !== entry.id
  ) {
    throw new Error(`Pack identity mismatch for ${entry.id}.`);
  }
  if (!Array.isArray(sourceData?.sources) || !Array.isArray(visualData?.visuals)) {
    throw new Error(`Pack ${entry.id} must declare source and visual arrays.`);
  }
  const manifestImages = new Set();
  for (const declared of manifest?.images ?? []) {
    const imagePath = safeImagePath(
      declared,
      `Pack ${entry.id} has an invalid or traversing manifest image path.`,
    );
    if (manifestImages.has(imagePath)) {
      throw new Error(`Pack ${entry.id} declares duplicate image ${imagePath}.`);
    }
    manifestImages.add(imagePath);
  }

  const sourceIds = new Set();
  for (const source of sourceData.sources) {
    requireText(source?.id, `Pack ${entry.id} has a source without an id.`);
    if (sourceIds.has(source.id)) {
      throw new Error(`Pack ${entry.id} has duplicate source ${source.id}.`);
    }
    sourceIds.add(source.id);
    for (const field of ["title", "publisher", "url", "supports", "retrieved_at"]) {
      requireText(
        source[field],
        `Source ${source.id} in ${entry.id} needs ${field}.`,
      );
    }
  }

  const outputNames = new Set();
  const declaredByVisual = new Set();
  const visuals = [];
  const publicPackRoot = path.join(assetsRoot, entry.id);
  await mkdir(publicPackRoot, { recursive: true });
  for (const visual of visualData.visuals) {
    for (const field of requiredVisualFields) {
      requireText(
        visual?.[field],
        `Visual ${visual?.id || "unknown"} in ${entry.id} needs ${field}.`,
      );
    }
    if (!allowedLicenses.has(visual.license)) {
      throw new Error(
        `Visual ${visual.id} in ${entry.id} uses non-allowlisted license ${visual.license}.`,
      );
    }
    if (!sourceIds.has(visual.source_id)) {
      throw new Error(
        `Visual ${visual.id} in ${entry.id} references unknown source ${visual.source_id}.`,
      );
    }
    const imageRelative = safeImagePath(
      visual.path,
      `Visual ${visual.id} in ${entry.id} has an invalid or traversing image path.`,
    );
    if (!manifestImages.has(imageRelative)) {
      throw new Error(
        `Visual ${visual.id} in ${entry.id} references an undeclared or unknown image ${imageRelative}.`,
      );
    }
    if (declaredByVisual.has(imageRelative)) {
      throw new Error(
        `Pack ${entry.id} maps image ${imageRelative} more than once.`,
      );
    }
    declaredByVisual.add(imageRelative);
    const extension = path.extname(imageRelative).toLowerCase();
    const base = slug(path.basename(imageRelative, extension));
    const outputName = `${slug(visual.id)}-${base}${extension}`;
    if (outputNames.has(outputName)) {
      throw new Error(
        `Pack ${entry.id} produces duplicate output name ${outputName}.`,
      );
    }
    outputNames.add(outputName);
    const sourceImage = path.join(packRoot, imageRelative);
    const file = await readFile(sourceImage);
    const actualHash = createHash("sha256").update(file).digest("hex");
    if (actualHash !== visual.sha256) {
      throw new Error(`Visual ${visual.id} in ${entry.id} has a hash mismatch.`);
    }
    if (file.byteLength !== visual.byte_size) {
      throw new Error(
        `Visual ${visual.id} in ${entry.id} has a byte-size mismatch.`,
      );
    }
    if (
      !Number.isInteger(visual.width)
      || visual.width <= 0
      || !Number.isInteger(visual.height)
      || visual.height <= 0
    ) {
      throw new Error(
        `Visual ${visual.id} in ${entry.id} needs valid image dimensions.`,
      );
    }
    await copyFile(sourceImage, path.join(publicPackRoot, outputName));
    visuals.push({
      ...visual,
      public_path: `/styles/${entry.id}/${outputName}`,
    });
  }
  for (const declared of manifestImages) {
    if (!declaredByVisual.has(declared)) {
      throw new Error(
        `Pack ${entry.id} manifest declares unknown image ${declared}.`,
      );
    }
  }

  const quickSections = markdownSections(quick);
  const fieldSections = markdownSections(field);
  const definition = quickSections.definition;
  requireText(definition, `Pack ${entry.id} quick guide needs Definition.`);
  for (const section of [
    "origins",
    "design_logic",
    "current_expressions",
    "room_translation",
    "misreadings",
  ]) {
    requireText(
      fieldSections[section],
      `Pack ${entry.id} field guide needs ${section.replaceAll("_", " ")}.`,
    );
  }
  return {
    id: entry.id,
    name: pack.name,
    aliases: pack.aliases,
    version: pack.version,
    reviewed_at: pack.reviewed_at,
    summary: firstParagraph(definition),
    definition,
    coverage: {
      sources: sourceData.sources.length,
      visuals: visualData.visuals.length,
      reviewed_at: pack.reviewed_at,
    },
    sections: fieldSections,
    signals: {
      historical_core: signals.historical_core,
      current_expressions: signals.current_expressions,
      composition: signals.composition,
      furniture_forms: signals.furniture_forms,
      materials: signals.materials,
      palette: signals.palette,
      lighting: signals.lighting,
      textiles_art: signals.textiles_art,
      spatial_density: signals.spatial_density,
      variants: signals.variants,
      adjacent_styles: signals.adjacent_styles,
      questions: signals.questions,
      cliches_to_avoid: signals.cliches_to_avoid,
    },
    sources: sourceData.sources,
    visuals,
  };
}

function markdownSections(markdown) {
  const normalized = markdown.replaceAll("\r\n", "\n");
  const matches = [...normalized.matchAll(/^## (.+)$/gm)];
  const sections = {};
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const key = slug(match[1]).replaceAll("-", "_");
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    sections[key] = normalized.slice(start, end).trim();
  }
  return sections;
}

function firstParagraph(value) {
  return value.split(/\n\s*\n/)[0].replaceAll(/\s+/g, " ").trim();
}

function safeImagePath(value, message) {
  const relative = safeRelative(value, message);
  if (!relative.startsWith("images/") || path.extname(relative) === "") {
    throw new Error(message);
  }
  return relative;
}

function safeRelative(value, message) {
  requireText(value, message);
  if (
    path.posix.isAbsolute(value)
    || value.includes("\\")
    || value.split("/").includes("..")
    || path.posix.normalize(value) !== value
  ) {
    throw new Error(message);
  }
  return value;
}

function slug(value) {
  const output = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  if (!output) throw new Error(`Cannot create a stable output name from ${value}.`);
  return output;
}

function requireText(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
}

async function readJson(file) {
  let value;
  try {
    value = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(
      `Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return value;
}

async function compareOutput({
  expectedData,
  expectedAssets,
  committedData,
  committedAssets,
}) {
  const drift = [];
  const [expectedDataBytes, committedDataBytes] = await Promise.all([
    readFile(expectedData),
    readFileOrNull(committedData),
  ]);
  if (committedDataBytes === null) {
    drift.push(`${display(committedData)} is missing`);
  } else if (!expectedDataBytes.equals(committedDataBytes)) {
    drift.push(`${display(committedData)} changed`);
  }

  const expectedFiles = await fileInventory(expectedAssets);
  const committedFiles = await fileInventory(committedAssets, true);
  for (const file of expectedFiles.keys()) {
    if (!committedFiles.has(file)) {
      drift.push(`${display(path.join(committedAssets, file))} is missing`);
    } else if (expectedFiles.get(file) !== committedFiles.get(file)) {
      drift.push(`${display(path.join(committedAssets, file))} changed`);
    }
  }
  for (const file of committedFiles.keys()) {
    if (!expectedFiles.has(file)) {
      drift.push(`${display(path.join(committedAssets, file))} is extra`);
    }
  }
  return drift;
}

async function fileInventory(root, missingIsEmpty = false) {
  const inventory = new Map();
  try {
    await walk(root, "");
  } catch (error) {
    if (
      missingIsEmpty
      && error instanceof Error
      && "code" in error
      && error.code === "ENOENT"
    ) {
      return inventory;
    }
    throw error;
  }
  return inventory;

  async function walk(directory, prefix) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Symlinks are not allowed in synchronized output: ${absolute}`);
      }
      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        const bytes = await readFile(absolute);
        inventory.set(
          relative,
          createHash("sha256").update(bytes).digest("hex"),
        );
      } else {
        const info = await lstat(absolute);
        throw new Error(`Unsupported output entry ${absolute}: ${info.mode}`);
      }
    }
  }
}

async function readFileOrNull(file) {
  try {
    return await readFile(file);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function display(file) {
  const relative = path.relative(repositoryRoot, file);
  return relative.startsWith("..") ? file : relative;
}
