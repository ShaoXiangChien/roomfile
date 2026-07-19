import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const skillDir = path.resolve("skills/roomfile");

async function read(relativePath) {
  return readFile(path.join(skillDir, relativePath), "utf8");
}

test("style command resolves known packs through progressive loading", async () => {
  const [skill, workflows, atlas] = await Promise.all([
    read("SKILL.md"),
    read("references/workflows.md"),
    read("references/style-atlas.md"),
  ]);

  assert.match(skill, /\|\s*`style`\s*\|/);
  assert.match(workflows, /## `style`/);
  assert.match(atlas, /resolve-style\.mjs/);
  assert.match(
    atlas,
    /index\.json[\s\S]*style-pack\.json[\s\S]*quick-guide\.md[\s\S]*signals\.json[\s\S]*visuals\.json/i,
  );
  assert.match(
    atlas,
    /reviewed_at[\s\S]*six calendar months[\s\S]*current date[\s\S]*needs-live-research/i,
  );
  assert.match(
    atlas,
    /visuals\.json.*metadata[\s\S]*visual IDs.*captions.*attribution/is,
  );
  assert.match(
    atlas,
    /do not load.*image files[\s\S]*(asks to see|render-reference selection)/is,
  );
  assert.match(
    atlas,
    /field-guide\.md[\s\S]*sources\.json[\s\S]*(deep|conflict|comparison|cultural|historical)/i,
  );
  assert.match(skill, /`style`.*without an initialized project/is);
});

test("style command persists cited live research without downloading unverified images", async () => {
  const [atlas, workflows] = await Promise.all([
    read("references/style-atlas.md"),
    read("references/workflows.md"),
  ]);

  for (const trigger of [
    /no pack resolves/i,
    /substyle.*region.*era.*current trend/is,
    /user evidence conflicts/i,
    /older than six months/i,
    /without guessing/i,
  ]) {
    assert.match(atlas, trigger);
  }
  assert.match(atlas, /museums.*official archives.*designer foundations.*original works/is);
  assert.match(atlas, /academic.*curatorial.*practitioner interviews/is);
  assert.match(atlas, /design media.*social.*retailer.*present-day usage/is);
  assert.match(atlas, /inspiration\/research\//);
  assert.match(atlas, /cited/i);
  assert.match(atlas, /Do not download[\s\S]*allowlisted license/i);
  assert.match(
    atlas,
    /if\s+(?:an\s+initialized\s+)?project\s+exists[\s\S]*inspiration\/research\/[\s\S]*without a project[\s\S]*cited[\s\S]*results[\s\S]*(do not write|without writing)/i,
  );
  assert.match(
    workflows,
    /if\s+(?:an\s+initialized\s+)?project\s+exists[\s\S]*inspiration\/research\/[\s\S]*without a project[\s\S]*cited[\s\S]*results[\s\S]*(do not write|without writing)/i,
  );
});

test("taste applies the evidence hierarchy and persists style provenance", async () => {
  const [workflows, dataModel] = await Promise.all([
    read("references/workflows.md"),
    read("references/data-model.md"),
  ]);

  assert.match(
    workflows,
    /measured.*observed.*locked architecture[\s\S]*concrete reactions.*inspiration.*anti-references.*overrides[\s\S]*adopted pack signals[\s\S]*general pack guidance/is,
  );
  assert.match(workflows, /style label alone.*hypothesis.*never.*render evidence/is);
  assert.match(workflows, /adopted.*rejected.*uncertain.*overridden/is);
  assert.match(workflows, /multiple.*zero packs.*valid/is);
  assert.match(workflows, /user evidence.*authoritative/is);
  assert.match(dataModel, /inspiration\/style-context\.json/);
  assert.match(dataModel, /pack_refs.*read_at/is);
  assert.match(dataModel, /live_research_sources.*reference_images/is);
});

test("all design workflows use Atlas as a lens rather than a preset or allowlist", async () => {
  const workflows = await read("references/workflows.md");

  assert.match(workflows, /## `brief`[\s\S]*adopted.*rejected.*uncertain.*overrides/is);
  assert.match(workflows, /## `explore`[\s\S]*never.*presets.*allowlist/is);
  assert.match(workflows, /## `refine`[\s\S]*retain.*pack refs.*user overrides/is);
  assert.match(workflows, /## `status`[\s\S]*style context.*materially blocks/is);
  assert.match(
    workflows,
    /## `audit`[\s\S]*style label[\s\S]*stale pack refs[\s\S]*overrode user evidence[\s\S]*unlicensed[\s\S]*invented historical/is,
  );
});

test("STYLE template remains human-editable while recording Atlas decisions", async () => {
  const template = await read("assets/templates/STYLE.md");
  for (const heading of [
    "Working hypothesis",
    "Evidence",
    "Pack context",
    "Adopted signals",
    "Rejected signals",
    "Uncertain signals",
    "User overrides",
    "Contradictions",
    "Likes",
    "Dislikes",
    "Anti-references",
  ]) {
    assert.match(template, new RegExp(`## ${heading}\\b`));
  }
});
