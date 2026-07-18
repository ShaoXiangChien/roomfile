import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/roomfile/scripts/init-project.mjs");

function run(args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("private initialization creates a US project and one gitignore block", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-private-"));
  const first = run(["--target", target, "--privacy", "private", "--json"], target);

  assert.equal(first.status, 0, first.stderr || first.stdout);
  const result = JSON.parse(first.stdout);
  assert.equal(result.status, "success");
  assert.equal(result.artifacts.length > 0, true);

  const manifest = JSON.parse(
    await readFile(path.join(target, "roomfile", "roomfile.json"), "utf8"),
  );
  assert.equal(manifest.schema_version, "0.1.0");
  assert.equal(manifest.country, "US");
  assert.equal(manifest.currency, "USD");
  assert.equal(manifest.measurement_unit, "in");
  assert.deepEqual(manifest.preferred_retailers.slice(0, 2), [
    "IKEA US",
    "Amazon US",
  ]);

  await stat(path.join(target, "roomfile", "rooms", "living-room", "geometry.json"));
  const ignore = await readFile(path.join(target, ".gitignore"), "utf8");
  assert.equal((ignore.match(/# roomfile-private-start/g) ?? []).length, 1);
  assert.match(ignore, /^roomfile\/$/m);

  const second = run(["--target", target, "--privacy", "private", "--json"], target);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  const ignoreAfter = await readFile(path.join(target, ".gitignore"), "utf8");
  assert.equal((ignoreAfter.match(/# roomfile-private-start/g) ?? []).length, 1);
  assert.equal(JSON.parse(second.stdout).warnings.includes("Project already exists; no files overwritten."), true);
});

test("public-demo initialization does not hide the generated project", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-demo-"));
  const result = run(
    ["--target", target, "--privacy", "public-demo", "--json"],
    target,
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const manifest = JSON.parse(
    await readFile(path.join(target, "roomfile", "roomfile.json"), "utf8"),
  );
  assert.equal(manifest.privacy_mode, "public-demo");
  await assert.rejects(readFile(path.join(target, ".gitignore"), "utf8"));
});
