#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  escapeXml,
  failInput,
  parseArgs,
  printResult,
  productBounds,
  readJson,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  if (!args.geometry || !args.products || !args.output) {
    throw new Error("--geometry, --products, and --output are required");
  }
  const geometryPath = path.resolve(String(args.geometry));
  const productsPath = path.resolve(String(args.products));
  const output = path.resolve(String(args.output));
  const geometry = await readJson(geometryPath);
  const catalog = await readJson(productsPath);
  const points = geometry?.boundary?.points ?? [];
  if (points.length < 3) throw new Error("geometry boundary needs at least three points");

  const minX = Math.min(...points.map((point) => Number(point.x)));
  const minY = Math.min(...points.map((point) => Number(point.y)));
  const maxX = Math.max(...points.map((point) => Number(point.x)));
  const maxY = Math.max(...points.map((point) => Number(point.y)));
  const padding = 28;
  const scale = Math.min(900 / Math.max(maxX - minX, 1), 600 / Math.max(maxY - minY, 1));
  const sx = (value) => padding + (Number(value) - minX) * scale;
  const sy = (value) => padding + (Number(value) - minY) * scale;

  const polygon = points.map((point) => `${sx(point.x)},${sy(point.y)}`).join(" ");
  const elements = [
    `<polygon points="${polygon}" class="boundary"/>`,
  ];

  for (const zone of geometry.clearance_zones ?? []) {
    elements.push(rect(zone, "clearance", zone.id, sx, sy, scale));
  }
  for (const opening of geometry.openings ?? []) {
    elements.push(rect(opening, "opening", opening.id, sx, sy, scale));
  }
  for (const fixed of geometry.fixed_elements ?? []) {
    elements.push(rect(fixed, "fixed", fixed.id, sx, sy, scale));
  }
  for (const product of catalog.products ?? []) {
    const bounds = productBounds(product);
    elements.push(
      rect(bounds, "product", product.name || product.id, sx, sy, scale),
    );
  }

  const width = Math.ceil((maxX - minX) * scale + padding * 2);
  const height = Math.ceil((maxY - minY) * scale + padding * 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Roomfile scaled layout</title>
<desc id="desc">Measured room boundary, openings, clearance zones, fixed elements, and placed products. Visual renders are approximate; this diagram is dimension-based.</desc>
<style>
  .boundary{fill:#f3efe7;stroke:#1e1b18;stroke-width:3}
  .product{fill:#59624d;fill-opacity:.86;stroke:#1e1b18;stroke-width:1.5}
  .opening{fill:#b86f52;fill-opacity:.62;stroke:#1e1b18;stroke-width:1}
  .fixed{fill:#b49255;fill-opacity:.7;stroke:#1e1b18;stroke-width:1}
  .clearance{fill:#ffffff;fill-opacity:.2;stroke:#b86f52;stroke-width:1.5;stroke-dasharray:6 4}
  text{font:12px ui-monospace,monospace;fill:#1e1b18;text-anchor:middle;dominant-baseline:middle}
</style>
${elements.join("\n")}
</svg>
`;
  await writeFile(output, svg);
  const payload = result("success", [], [], [output]);
  printResult(payload, asJson);
} catch (error) {
  failInput(error, asJson);
}

function rect(item, className, label, sx, sy, scale) {
  const x = sx(item.x);
  const y = sy(item.y);
  const width = Number(item.width) * scale;
  const height = Number(item.depth) * scale;
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2" class="${className}"/><text x="${x + width / 2}" y="${y + height / 2}">${escapeXml(label)}</text></g>`;
}
