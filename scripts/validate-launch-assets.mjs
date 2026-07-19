#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectImage } from "../skills/roomfile/scripts/image-validation.mjs";

const args = parseArgs(process.argv.slice(2));
const errors = [];
const artifacts = [];

try {
  const manifestPath = path.resolve(String(args.manifest || "launch/manifest.json"));
  const launchRoot = path.dirname(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const altText = await readFile(path.join(launchRoot, "ALT-TEXT.md"), "utf8");
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const files = new Set();
  const alts = new Set();
  if (manifest.schema_version !== "0.3.0" || assets.length !== 13) {
    issue("invalid_launch_manifest", "Launch manifest must declare exactly 13 v0.3.0 assets.");
  }
  for (const asset of assets) {
    if (
      !asset
      || typeof asset.file !== "string"
      || path.isAbsolute(asset.file)
      || asset.file.split("/").includes("..")
      || files.has(asset.file)
    ) {
      issue("invalid_launch_manifest", "Each launch asset needs a unique relative file.");
      continue;
    }
    files.add(asset.file);
    if (
      typeof asset.alt !== "string"
      || asset.alt.length < 40
      || alts.has(asset.alt)
      || !Array.isArray(asset.visible_text)
      || asset.visible_text.length < 2
      || asset.visible_text.some((text) => typeof text !== "string" || !text.trim())
    ) {
      issue("invalid_alt_contract", `${asset.file} needs unique, content-specific alt and visible text.`);
    }
    alts.add(asset.alt);
    const section = altSection(altText, asset.file);
    if (!section || !section.includes(asset.alt)) {
      issue("invalid_alt_contract", `${asset.file} alt text does not match ALT-TEXT.md exactly.`);
    }
    const file = path.join(launchRoot, asset.file);
    try {
      const bytes = await readFile(file);
      inspectImage(bytes, {
        formats: ["PNG"],
        width: asset.width,
        height: asset.height,
        minByteSize: 10_000,
      });
      artifacts.push(file);
    } catch (error) {
      issue("invalid_launch_raster", `${asset.file}: ${error.message}`);
    }
  }
  print({
    status: errors.length ? "invalid" : "success",
    errors,
    warnings: [],
    artifacts,
  });
  process.exitCode = errors.length ? 1 : 0;
} catch (error) {
  print({
    status: "error",
    errors: [{ code: "malformed_input", message: error.message }],
    warnings: [],
    artifacts,
  });
  process.exitCode = 2;
}

function altSection(markdown, file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("^## `" + escaped + "`\\n\\n([^\\n]+)", "m").exec(markdown);
  return match?.[1] || "";
}

function issue(code, message) {
  errors.push({ code, message });
}

function parseArgs(values) {
  const output = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith("--")) continue;
    const next = values[index + 1];
    if (!next || next.startsWith("--")) output[values[index].slice(2)] = true;
    else {
      output[values[index].slice(2)] = next;
      index += 1;
    }
  }
  return output;
}

function print(value) {
  process.stdout.write(args.json ? JSON.stringify(value, null, 2) : `${value.status}\n`);
}
