import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(".");
const validator = path.join(root, "scripts/validate-launch-assets.mjs");

test("all launch rasters match their exact dimensions and per-asset alt contract", () => {
  const result = spawnSync(
    process.execPath,
    [validator, "--manifest", "launch/manifest.json", "--json"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "success");
  assert.equal(report.artifacts.length, 13);
});
