import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(
  root,
  "skills",
  "roomfile",
  "scripts",
  "build-render-brief.mjs",
);

test("render brief converts the structured contract into a Banana-ready prompt", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "roomfile-render-"));
  const requestPath = path.join(temporary, "render-request.json");
  const outputPath = path.join(temporary, "render-brief.md");
  await writeFile(
    requestPath,
    `${JSON.stringify(
      {
        schema_version: "0.1.0",
        concept_id: "japandi",
        concept_version: 1,
        canonical_images: ["../../assets/source/room.png"],
        goal: "Create a quiet Japandi living room.",
        locked_facts: [
          "keep the exact window and door locations",
          "keep the existing sofa",
        ],
        allowed_changes: ["add a pale timber coffee table"],
        style_evidence: ["textured neutrals", "quiet negative space"],
        product_references: ["IKEA 205.572.85"],
        camera_view: "Same 4:3 phone-camera viewpoint.",
        output: "../../assets/generated/japandi.png",
        disclaimer:
          "Visual approximation — verify dimensions before purchasing.",
      },
      null,
      2,
    )}\n`,
  );

  const run = spawnSync(
    process.execPath,
    [
      script,
      "--request",
      requestPath,
      "--output",
      outputPath,
      "--adapter",
      "banana",
      "--json",
    ],
    { encoding: "utf8" },
  );

  assert.equal(run.status, 0, run.stderr || run.stdout);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.status, "success");
  assert.deepEqual(payload.errors, []);
  assert.ok(payload.artifacts.includes(outputPath));

  const brief = await readFile(outputPath, "utf8");
  assert.match(brief, /Banana render brief/);
  assert.match(brief, /Create a quiet Japandi living room/);
  assert.match(brief, /MUST preserve.*exact window and door locations/is);
  assert.match(brief, /Allowed edits/);
  assert.match(brief, /IKEA 205\.572\.85/);
  assert.match(brief, /Same 4:3 phone-camera viewpoint/);
  assert.match(brief, /Visual approximation/);
  assert.match(brief, /previous_interaction_id/);
});

test("render brief rejects requests without locked facts", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "roomfile-render-bad-"));
  const requestPath = path.join(temporary, "render-request.json");
  await writeFile(
    requestPath,
    `${JSON.stringify({
      schema_version: "0.1.0",
      concept_id: "unsafe",
      concept_version: 1,
      canonical_images: [],
      goal: "Make it pretty.",
      locked_facts: [],
      allowed_changes: [],
      style_evidence: [],
      product_references: [],
      camera_view: "Same camera viewpoint.",
      output: "render.png",
      disclaimer: "Visual approximation.",
    })}\n`,
  );

  const run = spawnSync(
    process.execPath,
    [script, "--request", requestPath, "--json"],
    { encoding: "utf8" },
  );

  assert.equal(run.status, 2);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.status, "error");
  assert.match(JSON.stringify(payload.errors), /locked_facts/);
});
