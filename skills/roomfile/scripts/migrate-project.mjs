#!/usr/bin/env node
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  emptyStyleContext,
  failInput,
  parseArgs,
  printResult,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  if (!args.project) throw new Error("--project is required");
  if (args.to !== SCHEMA_VERSION) {
    throw new Error(`--to must be ${SCHEMA_VERSION}`);
  }
  const project = path.resolve(String(args.project));
  const manifestPath = path.join(project, "roomfile.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!SUPPORTED_SCHEMA_VERSIONS.has(manifest.schema_version)) {
    throw new Error(`unsupported schema ${manifest.schema_version}`);
  }
  const jsonFiles = await collectJsonFiles(project);
  const artifacts = [];
  for (const file of jsonFiles) {
    const value = JSON.parse(await readFile(file, "utf8"));
    if (!value || typeof value !== "object" || !value.schema_version) continue;
    if (!SUPPORTED_SCHEMA_VERSIONS.has(value.schema_version)) {
      throw new Error(`${file} uses unsupported schema ${value.schema_version}`);
    }
    if (value.schema_version === SCHEMA_VERSION) continue;
    value.schema_version = SCHEMA_VERSION;
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
    artifacts.push(file);
  }
  const styleContextPath = path.join(project, "inspiration", "style-context.json");
  if (!(await exists(styleContextPath))) {
    await mkdir(path.dirname(styleContextPath), { recursive: true });
    await writeFile(styleContextPath, `${JSON.stringify(emptyStyleContext(), null, 2)}\n`);
    artifacts.push(styleContextPath);
  }
  const warnings =
    artifacts.length === 0 ? [`Project already uses schema ${SCHEMA_VERSION}.`] : [];
  printResult(result("success", [], warnings, artifacts.length ? artifacts : [manifestPath]), asJson);
} catch (error) {
  failInput(error, asJson);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function collectJsonFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(file)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(file);
    }
  }
  return files.sort();
}
