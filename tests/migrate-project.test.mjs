import assert from "node:assert/strict";
import { cp, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const migrateScript = path.resolve("skills/roomfile/scripts/migrate-project.mjs");
const validateScript = path.resolve("skills/roomfile/scripts/validate-project.mjs");

function run(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("migration upgrades v0.2 data to v0.3 without changing project content", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-migrate-"));
  const project = path.join(target, "roomfile");
  await cp(path.resolve("examples/us-apartment/roomfile"), project, {
    recursive: true,
  });

  const manifestPath = path.join(project, "roomfile.json");
  const before = JSON.parse(await readFile(manifestPath, "utf8"));
  const productsBefore = await readFile(
    path.join(project, "rooms", "living-room", "products.json"),
    "utf8",
  );
  const first = run(
    migrateScript,
    ["--project", project, "--to", "0.3.0", "--json"],
    target,
  );

  assert.equal(first.status, 0, first.stderr || first.stdout);
  const report = JSON.parse(first.stdout);
  assert.equal(report.status, "success");
  const after = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(after.schema_version, "0.3.0");
  assert.equal(after.setup_status, "ready");
  assert.equal(after.retailer_strategy, "user-preferred");
  assert.equal(after.country, before.country);
  assert.equal(after.currency, before.currency);
  assert.equal(after.budget.amount, before.budget.amount);
  assert.deepEqual(after.rooms, before.rooms);
  assert.deepEqual(after.preferred_retailers, before.preferred_retailers);
  assert.equal(
    await readFile(path.join(project, "rooms", "living-room", "products.json"), "utf8"),
    productsBefore.replace('"0.2.0"', '"0.3.0"'),
  );
  const styleContextPath = path.join(project, "inspiration", "style-context.json");
  const styleContext = JSON.parse(await readFile(styleContextPath, "utf8"));
  assert.deepEqual(styleContext, {
    schema_version: "0.3.0",
    pack_refs: [],
    adopted_signals: [],
    rejected_signals: [],
    uncertain_signals: [],
    user_overrides: [],
    contradictions: [],
    live_research_sources: [],
    reference_images: [],
  });

  const validation = run(
    validateScript,
    ["--project", project, "--json"],
    target,
  );
  assert.equal(validation.status, 0, validation.stderr || validation.stdout);

  const snapshot = await readFile(manifestPath, "utf8");
  const second = run(
    migrateScript,
    ["--project", project, "--to", "0.3.0", "--json"],
    target,
  );
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(await readFile(manifestPath, "utf8"), snapshot);
  assert.equal(
    JSON.parse(second.stdout).warnings.some((warning) =>
      /already uses schema 0\.3\.0/i.test(warning),
    ),
    true,
  );
});
