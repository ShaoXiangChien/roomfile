import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const skillDir = path.resolve("skills/roomfile");
const commands = [
  "init",
  "status",
  "taste",
  "capture",
  "brief",
  "explore",
  "refine",
  "place",
  "source",
  "plan",
  "audit",
];

test("skill metadata and command router are complete", async () => {
  const skill = await readFile(path.join(skillDir, "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: roomfile\n/m);
  assert.match(skill, /description: Use when /);
  assert.doesNotMatch(skill, /TODO|TBD|PLACEHOLDER/i);
  for (const command of commands) {
    assert.match(skill, new RegExp(`\\b${command}\\b`), `missing ${command}`);
  }
  assert.match(skill, /observed.*measured.*inferred.*desired/s);
  assert.match(skill, /visual approximation/i);
  assert.match(skill, /approval/i);
});

test("focused references and schemas exist", async () => {
  const references = [
    "workflows.md",
    "data-model.md",
    "rendering.md",
    "sourcing.md",
    "safety.md",
  ];
  const schemas = [
    "geometry.schema.json",
    "facts.schema.json",
    "concept.schema.json",
    "products.schema.json",
    "render-request.schema.json",
  ];
  for (const file of references) {
    const content = await readFile(path.join(skillDir, "references", file), "utf8");
    assert.equal(content.length > 100, true, `${file} is unexpectedly empty`);
  }
  for (const file of schemas) {
    const schema = JSON.parse(
      await readFile(path.join(skillDir, "references", "schemas", file), "utf8"),
    );
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.properties.schema_version.const, "0.1.0");
  }
});

test("portable skill ships reusable templates and a render-contract translator", async () => {
  const required = [
    "assets/templates/ROOMFILE.md",
    "assets/templates/HOME.md",
    "assets/templates/STYLE.md",
    "assets/templates/INVENTORY.md",
    "assets/templates/ROOM.md",
    "assets/templates/DECISIONS.md",
    "assets/templates/SHOPPING.md",
    "assets/templates/EXECUTION.md",
    "scripts/build-render-brief.mjs",
  ];

  await Promise.all(
    required.map((entry) =>
      access(new URL(`../skills/roomfile/${entry}`, import.meta.url)),
    ),
  );
});

test("UI metadata describes Roomfile without hard tool dependencies", async () => {
  const metadata = await readFile(
    path.join(skillDir, "agents", "openai.yaml"),
    "utf8",
  );
  assert.match(metadata, /display_name: "Roomfile"/);
  assert.match(metadata, /default_prompt: "Use \$roomfile /);
  assert.doesNotMatch(metadata, /^dependencies:/m);
});
