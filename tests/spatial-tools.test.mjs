import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const checkScript = path.resolve("skills/roomfile/scripts/check-fit.mjs");
const renderScript = path.resolve("skills/roomfile/scripts/render-layout.mjs");

const geometry = {
  schema_version: "0.1.0",
  unit: "in",
  boundary: {
    type: "polygon",
    points: [
      { x: 0, y: 0 },
      { x: 144, y: 0 },
      { x: 144, y: 120 },
      { x: 0, y: 120 },
    ],
  },
  openings: [
    {
      id: "entry-door",
      kind: "door",
      x: 0,
      y: 12,
      width: 36,
      depth: 36,
      clearance: { x: 0, y: 12, width: 36, depth: 36 },
    },
  ],
  fixed_elements: [],
  clearance_zones: [
    { id: "main-path", x: 48, y: 0, width: 36, depth: 120 },
  ],
};

function run(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
  });
}

async function setup(products) {
  const target = await mkdtemp(path.join(tmpdir(), "roomfile-spatial-"));
  const geometryPath = path.join(target, "geometry.json");
  const productsPath = path.join(target, "products.json");
  await writeFile(geometryPath, JSON.stringify(geometry, null, 2));
  await writeFile(
    productsPath,
    JSON.stringify({ schema_version: "0.1.0", products }, null, 2),
  );
  return { target, geometryPath, productsPath };
}

test("fit checker reports overlap, boundary overflow, and clearance conflicts", async () => {
  const fixture = await setup([
    {
      id: "sofa",
      name: "Sofa",
      dimensions: { width: 84, depth: 38, height: 32, unit: "in" },
      placement: { x: 72, y: 92, rotation: 0 },
    },
    {
      id: "chair",
      name: "Chair",
      dimensions: { width: 30, depth: 30, height: 30, unit: "in" },
      placement: { x: 82, y: 94, rotation: 0 },
    },
    {
      id: "shelf",
      name: "Shelf",
      dimensions: { width: 24, depth: 12, height: 72, unit: "in" },
      placement: { x: 138, y: 40, rotation: 0 },
    },
  ]);

  const result = run(
    checkScript,
    [
      "--geometry",
      fixture.geometryPath,
      "--products",
      fixture.productsPath,
      "--json",
    ],
    fixture.target,
  );

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "invalid");
  assert.equal(report.errors.some((item) => item.code === "product_overlap"), true);
  assert.equal(report.errors.some((item) => item.code === "outside_boundary"), true);
  assert.equal(report.errors.some((item) => item.code === "clearance_conflict"), true);
});

test("fit checker converts centimetres and accepts a valid layout", async () => {
  const fixture = await setup([
    {
      id: "media-console",
      name: "Media console",
      dimensions: { width: 152.4, depth: 38.1, height: 60, unit: "cm" },
      placement: { x: 114, y: 15, rotation: 0 },
    },
  ]);

  const result = run(
    checkScript,
    [
      "--geometry",
      fixture.geometryPath,
      "--products",
      fixture.productsPath,
      "--json",
    ],
    fixture.target,
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "success");
});

test("layout renderer creates a labeled deterministic SVG", async () => {
  const fixture = await setup([
    {
      id: "media-console",
      name: "Media console",
      dimensions: { width: 60, depth: 15, height: 24, unit: "in" },
      placement: { x: 114, y: 15, rotation: 0 },
    },
  ]);
  const output = path.join(fixture.target, "layout.svg");
  const result = run(
    renderScript,
    [
      "--geometry",
      fixture.geometryPath,
      "--products",
      fixture.productsPath,
      "--output",
      output,
      "--json",
    ],
    fixture.target,
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const svg = await readFile(output, "utf8");
  assert.match(svg, /^<svg/);
  assert.match(svg, /Media console/);
  assert.match(svg, /entry-door/);
  assert.match(svg, /main-path/);
});
