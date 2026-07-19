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
const atlasImage = path.join(
  root,
  "skills",
  "roomfile",
  "references",
  "style-atlas",
  "styles",
  "mid-century-modern",
  "images",
  "m-v4.jpg",
);

function baseRequest(overrides = {}) {
  return {
    schema_version: "0.3.0",
    concept_id: "collected-modern",
    concept_version: 2,
    canonical_images: ["../../assets/source/room.png"],
    goal: "Create a warm, lived-in living room.",
    locked_facts: ["LOCK_MARKER: preserve the exact room shell"],
    allowed_changes: ["replace the coffee table"],
    style_evidence: ["LEGACY_MARKER: layered personal collections"],
    product_references: [],
    camera_view: "Same 4:3 phone-camera viewpoint.",
    output: "../../assets/generated/collected-modern.png",
    disclaimer:
      "Visual approximation — verify dimensions, color, material, and availability before purchasing.",
    ...overrides,
  };
}

async function runBrief(request, prefix = "roomfile-render-v3-") {
  const temporary = await mkdtemp(path.join(os.tmpdir(), prefix));
  const requestPath = path.join(temporary, "render-request.json");
  const outputPath = path.join(temporary, "render-brief.md");
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`);
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
  return { run, outputPath };
}

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

test("v0.3 render brief keeps style guidance in the required priority order", async () => {
  const { run, outputPath } = await runBrief(
    baseRequest({
      style_context: {
        schema_version: "0.3.0",
        pack_refs: [
          {
            id: "mid-century-modern",
            version: "0.3.0",
            read_at: "2026-07-19T00:00:00Z",
          },
        ],
        adopted_signals: [
          {
            signal: "ADOPTED_MARKER: readable circulation",
            source: "user reaction to inspiration-02",
          },
        ],
        rejected_signals: ["REJECTED_MARKER: starburst décor"],
        uncertain_signals: [],
        user_overrides: [
          {
            signal: "OVERRIDE_MARKER: keep the room densely collected",
            reason: "books must stay visible",
          },
        ],
        contradictions: [],
        live_research_sources: [],
        reference_images: [],
      },
    }),
  );

  assert.equal(run.status, 0, run.stderr || run.stdout);
  const brief = await readFile(outputPath, "utf8");
  const locks = brief.indexOf("LOCK_MARKER");
  const overrides = brief.indexOf("OVERRIDE_MARKER");
  const adopted = brief.indexOf("ADOPTED_MARKER");
  const legacy = brief.indexOf("LEGACY_MARKER");
  const pack = brief.indexOf("Describe spatial hierarchy");
  assert.ok(locks < overrides && overrides < adopted && adopted < legacy && legacy < pack);
  assert.match(brief, /Negative guidance[\s\S]*REJECTED_MARKER/is);
  assert.equal(
    brief.slice(0, brief.indexOf("Negative guidance")).includes("REJECTED_MARKER"),
    false,
  );
  assert.match(brief, /negative guidance conflicts.*user override.*override wins/i);
  assert.match(brief, /deterministic fit.*authoritative/i);
});

test("v0.2 render request remains compatible when style_context is absent", async () => {
  const { run, outputPath } = await runBrief(
    {
      ...baseRequest(),
      schema_version: "0.2.0",
    },
    "roomfile-render-v2-",
  );

  assert.equal(run.status, 0, run.stderr || run.stdout);
  const brief = await readFile(outputPath, "utf8");
  assert.match(brief, /LEGACY_MARKER/);
  assert.doesNotMatch(brief, /Invalid style context/i);
});

test("render brief resolves declared public Atlas images separately from private inputs", async () => {
  const { run, outputPath } = await runBrief(
    baseRequest({
      style_context: {
        schema_version: "0.3.0",
        pack_refs: [
          {
            id: "mid-century-modern",
            version: "0.3.0",
            read_at: "2026-07-19T00:00:00Z",
          },
        ],
        adopted_signals: [],
        rejected_signals: [],
        uncertain_signals: [],
        user_overrides: [],
        contradictions: [],
        live_research_sources: [],
        reference_images: [
          {
            pack_id: "mid-century-modern",
            visual_id: "M-V4",
            path: "images/m-v4.jpg",
            reason: "Layered textile and collection evidence.",
          },
        ],
      },
    }),
  );

  assert.equal(run.status, 0, run.stderr || run.stdout);
  const brief = await readFile(outputPath, "utf8");
  assert.match(brief, /Private canonical room inputs/);
  assert.match(brief, /Public Style Atlas reference images/);
  assert.match(brief, new RegExp(atlasImage.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(brief, /do not replace.*consent/i);
});

test("render brief rejects traversal in an Atlas reference image path", async () => {
  const request = baseRequest({
    style_context: {
      schema_version: "0.3.0",
      pack_refs: [
        {
          id: "mid-century-modern",
          version: "0.3.0",
          read_at: "2026-07-19T00:00:00Z",
        },
      ],
      adopted_signals: [],
      rejected_signals: [],
      uncertain_signals: [],
      user_overrides: [],
      contradictions: [],
      live_research_sources: [],
      reference_images: [
        {
          pack_id: "mid-century-modern",
          visual_id: "M-V4",
          path: "../../../../../private-room.jpg",
          reason: "Malicious traversal.",
        },
      ],
    },
  });
  const { run } = await runBrief(request, "roomfile-render-traversal-");

  assert.equal(run.status, 2);
  assert.match(run.stdout, /traversal|declared|reference image path/i);
});

test("render brief rejects visual IDs that do not belong to the declared pack", async () => {
  const request = baseRequest({
    style_context: {
      schema_version: "0.3.0",
      pack_refs: [
        {
          id: "bauhaus",
          version: "0.3.0",
          read_at: "2026-07-19T00:00:00Z",
        },
      ],
      adopted_signals: [],
      rejected_signals: [],
      uncertain_signals: [],
      user_overrides: [],
      contradictions: [],
      live_research_sources: [],
      reference_images: [
        {
          pack_id: "bauhaus",
          visual_id: "M-V4",
          path: "images/m-v4.jpg",
          reason: "Pack mismatch.",
        },
      ],
    },
  });
  const { run } = await runBrief(request, "roomfile-render-mismatch-");

  assert.equal(run.status, 2);
  assert.match(run.stdout, /visual ID|pack mismatch|not declared/i);
});

test("render brief rejects malformed optional style_context", async () => {
  const request = baseRequest({
    style_context: {
      schema_version: "0.3.0",
      pack_refs: [],
      adopted_signals: [],
    },
  });
  const { run } = await runBrief(request, "roomfile-render-invalid-context-");

  assert.equal(run.status, 2);
  assert.match(run.stdout, /style_context/i);
});
