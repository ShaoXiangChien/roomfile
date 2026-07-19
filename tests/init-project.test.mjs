import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
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

test("private initialization applies a non-US shopping profile and one gitignore block", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-private-"));
  const profilePath = path.join(target, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify({
      project_name: "Montréal home",
      country: "CA",
      region: "Québec",
      postal_code: "H2X 1Y4",
      currency: "CAD",
      measurement_unit: "cm",
      budget: { amount: 4200, currency: "CAD" },
      preferred_retailers: ["EQ3", "Article"],
      retailer_strategy: "user-preferred",
      rooms: [{ id: "salon", name: "Salon" }],
    }),
  );
  const first = run(
    [
      "--target",
      target,
      "--privacy",
      "private",
      "--profile",
      profilePath,
      "--json",
    ],
    target,
  );

  assert.equal(first.status, 0, first.stderr || first.stdout);
  const result = JSON.parse(first.stdout);
  assert.equal(result.status, "success");
  assert.equal(result.artifacts.length > 0, true);

  const manifest = JSON.parse(
    await readFile(path.join(target, "roomfile", "roomfile.json"), "utf8"),
  );
  assert.equal(manifest.schema_version, "0.3.0");
  assert.equal(manifest.setup_status, "ready");
  assert.equal(manifest.country, "CA");
  assert.equal(manifest.region, "Québec");
  assert.equal(manifest.currency, "CAD");
  assert.equal(manifest.measurement_unit, "cm");
  assert.equal(manifest.retailer_strategy, "user-preferred");
  assert.deepEqual(manifest.preferred_retailers, ["EQ3", "Article"]);
  assert.deepEqual(
    JSON.parse(
      await readFile(
        path.join(target, "roomfile", "inspiration", "style-context.json"),
        "utf8",
      ),
    ),
    {
      schema_version: "0.3.0",
      pack_refs: [],
      adopted_signals: [],
      rejected_signals: [],
      uncertain_signals: [],
      user_overrides: [],
      contradictions: [],
      live_research_sources: [],
      reference_images: [],
    },
  );

  const geometry = JSON.parse(
    await readFile(
      path.join(target, "roomfile", "rooms", "salon", "geometry.json"),
      "utf8",
    ),
  );
  assert.equal(geometry.unit, "cm");
  await stat(path.join(target, "roomfile", "rooms", "salon", "geometry.json"));
  const ignore = await readFile(path.join(target, ".gitignore"), "utf8");
  assert.equal((ignore.match(/# roomfile-private-start/g) ?? []).length, 1);
  assert.match(ignore, /^roomfile\/$/m);

  const second = run(
    [
      "--target",
      target,
      "--privacy",
      "private",
      "--profile",
      profilePath,
      "--json",
    ],
    target,
  );
  assert.equal(second.status, 0, second.stderr || second.stdout);
  const ignoreAfter = await readFile(path.join(target, ".gitignore"), "utf8");
  assert.equal((ignoreAfter.match(/# roomfile-private-start/g) ?? []).length, 1);
  assert.equal(JSON.parse(second.stdout).warnings.includes("Project already exists; no files overwritten."), true);
});

test("initialization without a profile creates a neutral needs-profile scaffold", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-neutral-"));
  const result = run(
    ["--target", target, "--privacy", "public-demo", "--json"],
    target,
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(
    report.warnings.some((warning) => /shopping profile/i.test(warning)),
    true,
  );
  const manifest = JSON.parse(
    await readFile(path.join(target, "roomfile", "roomfile.json"), "utf8"),
  );
  assert.equal(manifest.schema_version, "0.3.0");
  assert.equal(manifest.setup_status, "needs-profile");
  assert.equal(manifest.country, "");
  assert.equal(manifest.currency, "");
  assert.equal(manifest.measurement_unit, null);
  assert.deepEqual(manifest.preferred_retailers, []);
  const styleContext = JSON.parse(
    await readFile(
      path.join(target, "roomfile", "inspiration", "style-context.json"),
      "utf8",
    ),
  );
  assert.deepEqual(styleContext.pack_refs, []);
  assert.deepEqual(styleContext.reference_images, []);
  assert.equal("retailer_strategy" in manifest, false);
  assert.doesNotMatch(JSON.stringify(manifest), /IKEA|Amazon|USD|United States/i);
});

test("public-demo initialization does not hide the generated project", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-demo-"));
  const profilePath = path.join(target, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify({
      project_name: "Demo home",
      country: "GB",
      region: "London",
      postal_code: "",
      currency: "GBP",
      measurement_unit: "cm",
      budget: { amount: 2500, currency: "GBP" },
      preferred_retailers: [],
      retailer_strategy: "agent-suggested",
      rooms: [{ id: "living-room", name: "Living room" }],
    }),
  );
  const result = run(
    [
      "--target",
      target,
      "--privacy",
      "public-demo",
      "--profile",
      profilePath,
      "--json",
    ],
    target,
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const manifest = JSON.parse(
    await readFile(path.join(target, "roomfile", "roomfile.json"), "utf8"),
  );
  assert.equal(manifest.privacy_mode, "public-demo");
  await assert.rejects(readFile(path.join(target, ".gitignore"), "utf8"));
});
