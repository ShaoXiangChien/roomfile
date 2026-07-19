import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(".");

test("repository has public launch and licensing contracts", async () => {
  const [readme, license, packageJson] = await Promise.all([
    readFile(path.join(root, "README.md"), "utf8"),
    readFile(path.join(root, "LICENSE"), "utf8"),
    readFile(path.join(root, "package.json"), "utf8"),
  ]);

  assert.match(readme, /Design your home, together/);
  assert.match(readme, /npx skills add ShaoXiangChien\/roomfile/);
  assert.match(readme, /understand.*space.*discover.*love.*iterate.*real/is);
  assert.doesNotMatch(readme, /Eclectic Mid-century Modern/);
  assert.doesNotMatch(readme, /Your room, remembered/);
  assert.doesNotMatch(readme, /serves US apartment renters/i);
  assert.match(readme, /Mid-century Modern/);
  assert.match(readme, /Bauhaus/);
  assert.match(readme, /Japandi/);
  assert.match(readme, /IKEA/);
  assert.match(readme, /Amazon/);
  assert.match(readme, /privacy/i);
  assert.match(readme, /visual approximation/i);
  assert.match(readme, /\$roomfile style/);
  assert.match(readme, /progressive/i);
  assert.match(readme, /live research/i);
  assert.match(readme, /image licen[cs]/i);
  assert.match(readme, /contribut/i);
  assert.match(readme, /controlled benchmark/i);
  assert.match(readme, /Apache-2\.0/);
  assert.match(license, /Apache License/);
  assert.match(license, /Version 2\.0/);

  const pkg = JSON.parse(packageJson);
  assert.equal(pkg.name, "roomfile");
  assert.equal(pkg.version, "0.3.0");
  assert.equal(pkg.license, "Apache-2.0");
  assert.equal(pkg.scripts.test.includes("node --test"), true);
});

test("GitHub workflows and issue templates cover release risks", async () => {
  const required = [
    ".github/workflows/ci.yml",
    ".github/ISSUE_TEMPLATE/bug.yml",
    ".github/ISSUE_TEMPLATE/feature.yml",
    ".github/ISSUE_TEMPLATE/retailer-failure.yml",
    ".github/ISSUE_TEMPLATE/stale-product-data.yml",
    ".github/ISSUE_TEMPLATE/false-fit.yml",
    ".github/dependabot.yml",
  ];
  await Promise.all(required.map((file) => access(path.join(root, file))));

  const workflow = await readFile(
    path.join(root, ".github/workflows/ci.yml"),
    "utf8",
  );
  assert.match(workflow, /node-version:\s*\[20,\s*22\]/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /website/);
  assert.match(workflow, /link/i);
  assert.match(workflow, /secret/i);
  assert.match(workflow, /fresh/i);
  assert.match(workflow, /validate:atlas/);
  assert.match(workflow, /sync:styles:check/);
  assert.match(workflow, /validate:benchmark/);
  assert.match(workflow, /validate:launch/);
  assert.match(workflow, /roomfile-shaoxiangchien\\\.ericchien21\\\.chatgpt\\\.site/);
  assert.match(workflow, /post-deploy production smoke/i);
});

test("social launch kit has editable copy, alt text, and required assets", async () => {
  const launch = path.join(root, "launch");
  const copy = await readFile(path.join(launch, "COPY.md"), "utf8");
  const alt = await readFile(path.join(launch, "ALT-TEXT.md"), "utf8");
  for (const platform of ["X", "LinkedIn", "Reddit", "Hacker News"]) {
    assert.match(copy, new RegExp(platform, "i"));
  }
  assert.match(copy, /Design your home, together/i);
  assert.match(copy, /first photo.*final placement/is);
  assert.match(copy, /v0\.3\.0/);
  assert.match(copy, /research behind the conversation/i);
  assert.match(alt, /before/i);
  assert.match(alt, /workflow/i);
  assert.match(alt, /research behind the conversation/i);

  const assets = [
    "og-card.png",
    "readme-hero.png",
    "repository-preview.png",
    "before-after/01.png",
    "before-after/05.png",
    "workflow/01.png",
    "workflow/05.png",
  ];
  await Promise.all(assets.map((file) => access(path.join(launch, file))));
});

test("v0.3 release notes document the Atlas, compatibility, and verification", async () => {
  const [notes, publicNotes] = await Promise.all([
    readFile(path.join(root, "RELEASE_NOTES_v0.3.0.md"), "utf8"),
    readFile(path.join(root, "docs/releases/v0.3.0.md"), "utf8"),
  ]);
  assert.match(notes, /Hybrid Style Atlas/i);
  assert.match(notes, /\$roomfile style/);
  assert.match(notes, /0\.2\.0.*0\.3\.0/is);
  assert.match(notes, /image licen[cs]/i);
  assert.match(notes, /benchmark/i);
  assert.match(notes, /npx skills add ShaoXiangChien\/roomfile/);
  assert.match(notes, /verification/i);
  assert.doesNotMatch(notes, /complete local gate|correctly return 404/i);
  assert.match(publicNotes, /Style Atlas/i);
  assert.match(publicNotes, /RELEASE_NOTES_v0\.3\.0\.md/);
});
