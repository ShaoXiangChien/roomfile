import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const demo = path.resolve("examples/us-apartment/roomfile");
const validator = path.resolve("skills/roomfile/scripts/validate-project.mjs");

test("fictional US apartment demo covers the complete public workflow", async () => {
  const manifest = JSON.parse(await readFile(path.join(demo, "roomfile.json"), "utf8"));
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

  const eclecticConcept = JSON.parse(
    await readFile(
      path.join(room, "concepts", "mid-century-modern", "concept.json"),
      "utf8",
    ),
  );
  assert.equal(
    eclecticConcept.style_direction,
    "Eclectic Mid-century Modern",
  );

  const eclecticRequest = JSON.parse(
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
  assert.match(eclecticRequest.goal, /Eclectic Mid-century Modern/);
  const styleEvidence = eclecticRequest.style_evidence.join(" ");
  assert.match(styleEvidence, /amber/i);
  assert.match(styleEvidence, /1970s/i);
  assert.match(styleEvidence, /collected/i);
  const allowedChanges = eclecticRequest.allowed_changes.join(" ");
  assert.match(allowedChanges, /lighting/i);
  assert.match(allowedChanges, /textiles/i);
  assert.match(allowedChanges, /art/i);
  const lockedFacts = eclecticRequest.locked_facts.join(" ");
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
});
