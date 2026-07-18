#!/usr/bin/env node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(".");
const temp = await mkdtemp(path.join(os.tmpdir(), "roomfile-smoke-"));

try {
  run(process.execPath, [
    path.join(root, "skills/roomfile/scripts/init-project.mjs"),
    "--target",
    temp,
    "--privacy",
    "private",
    "--json",
  ]);
  run(process.execPath, [
    path.join(root, "skills/roomfile/scripts/validate-project.mjs"),
    "--project",
    path.join(temp, "roomfile"),
    "--json",
  ]);
  const manifest = JSON.parse(
    await readFile(path.join(temp, "roomfile/roomfile.json"), "utf8"),
  );
  if (
    manifest.country !== "US" ||
    manifest.currency !== "USD" ||
    manifest.measurement_unit !== "in"
  ) {
    throw new Error("fresh project lost US defaults");
  }
  const ignore = await readFile(path.join(temp, ".gitignore"), "utf8");
  if (!ignore.includes("# roomfile-private-start") || !ignore.includes("roomfile/")) {
    throw new Error("private project was not gitignored");
  }
  console.log("Fresh Roomfile initialization and validation passed.");
} finally {
  await rm(temp, { recursive: true, force: true });
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
}
