import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const demo = path.resolve("examples/us-apartment/roomfile");
const validator = path.resolve("skills/roomfile/scripts/validate-project.mjs");

test("fictional apartment demo covers the complete Mid-century Modern workflow", async () => {
  const manifest = JSON.parse(await readFile(path.join(demo, "roomfile.json"), "utf8"));
  assert.equal(manifest.schema_version, "0.2.0");
  assert.equal(manifest.setup_status, "ready");
  assert.equal(manifest.retailer_strategy, "user-preferred");
  assert.equal(manifest.country, "US");
  assert.equal(manifest.currency, "USD");
  assert.equal(manifest.budget.amount, 3000);
  assert.equal(manifest.privacy_mode, "public-demo");
  assert.equal(manifest.postal_code.startsWith("000"), true);

  const room = path.join(demo, "rooms", "living-room");
  const conceptIds = ["mid-century-modern", "bauhaus", "japandi"];
  for (const concept of conceptIds) {
    await access(path.join(room, "concepts", concept, "concept.json"));
    await access(path.join(room, "concepts", concept, "render-request.json"));
  }

  const mcmConcept = JSON.parse(
    await readFile(
      path.join(room, "concepts", "mid-century-modern", "concept.json"),
      "utf8",
    ),
  );
  assert.equal(
    mcmConcept.style_direction,
    "Mid-century Modern",
  );

  const mcmRequest = JSON.parse(
    await readFile(
      path.join(
        room,
        "concepts",
        "mid-century-modern",
        "render-request-v1.json",
      ),
      "utf8",
    ),
  );
  assert.match(mcmRequest.goal, /Mid-century Modern/);
  assert.doesNotMatch(mcmRequest.goal, /Eclectic/);
  const styleEvidence = mcmRequest.style_evidence.join(" ");
  assert.match(styleEvidence, /amber/i);
  assert.match(styleEvidence, /1970s/i);
  assert.match(styleEvidence, /collected/i);
  const allowedChanges = mcmRequest.allowed_changes.join(" ");
  assert.match(allowedChanges, /lighting/i);
  assert.match(allowedChanges, /textiles/i);
  assert.match(allowedChanges, /art/i);
  const lockedFacts = mcmRequest.locked_facts.join(" ");
  for (const locked of [
    "window",
    "radiator",
    "floor",
    "sofa",
    "dining table",
    "camera",
  ]) {
    assert.match(lockedFacts, new RegExp(locked, "i"));
  }

  const products = JSON.parse(await readFile(path.join(room, "products.json"), "utf8"));
  assert.equal(products.products.some((item) => item.retailer === "IKEA US"), true);
  assert.equal(products.products.some((item) => item.retailer === "Amazon US"), true);
  assert.equal(
    products.products.every((item) => !/[?&](tag|ref|ascsubtag)=/i.test(item.source.url)),
    true,
  );
  assert.equal(products.products.some((item) => item.status === "approved"), true);

  const validation = spawnSync(
    process.execPath,
    [validator, "--project", demo, "--json"],
    { encoding: "utf8" },
  );
  assert.equal(validation.status, 0, validation.stderr || validation.stdout);
  await access(path.join(room, "layout.svg"));
  await access(path.join(room, "COMPARISON.md"));
  await access(path.join(room, "EXECUTION.md"));

  const projectText = await readFile(
    path.join(room, "concepts", "mid-century-modern", "render-request.md"),
    "utf8",
  );
  assert.doesNotMatch(projectText, /Eclectic/);
});
