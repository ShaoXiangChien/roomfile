import { readFile } from "node:fs/promises";

export const SCHEMA_VERSION = "0.1.0";

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export function result(status, errors = [], warnings = [], artifacts = []) {
  return { status, errors, warnings, artifacts };
}

export function printResult(payload, asJson = false) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  const lines = [`Roomfile: ${payload.status}`];
  for (const error of payload.errors) {
    lines.push(`ERROR ${error.code}: ${error.message}`);
  }
  for (const warning of payload.warnings) {
    lines.push(`WARNING: ${typeof warning === "string" ? warning : warning.message}`);
  }
  for (const artifact of payload.artifacts) {
    lines.push(`ARTIFACT: ${artifact}`);
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

export function failInput(error, asJson = false) {
  const payload = result("error", [
    {
      code: "invalid_input",
      message: error instanceof Error ? error.message : String(error),
    },
  ]);
  printResult(payload, asJson);
  process.exitCode = 2;
}

export function inches(amount, unit = "in") {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return Number.NaN;
  if (unit === "cm") return numeric / 2.54;
  return numeric;
}

export function productBounds(product) {
  const width = inches(product?.dimensions?.width, product?.dimensions?.unit);
  const depth = inches(product?.dimensions?.depth, product?.dimensions?.unit);
  const angle = ((Number(product?.placement?.rotation ?? 0) % 360) * Math.PI) / 180;
  const boundingWidth = Math.abs(width * Math.cos(angle)) + Math.abs(depth * Math.sin(angle));
  const boundingDepth = Math.abs(width * Math.sin(angle)) + Math.abs(depth * Math.cos(angle));
  const x = Number(product?.placement?.x);
  const y = Number(product?.placement?.y);
  return {
    x: x - boundingWidth / 2,
    y: y - boundingDepth / 2,
    width: boundingWidth,
    depth: boundingDepth,
    centerX: x,
    centerY: y,
  };
}

export function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.depth &&
    a.y + a.depth > b.y
  );
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = Number(polygon[i].x);
    const yi = Number(polygon[i].y);
    const xj = Number(polygon[j].x);
    const yj = Number(polygon[j].y);
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x <= ((xj - xi) * (point.y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside || pointOnPolygon(point, polygon);
}

function pointOnPolygon(point, polygon) {
  const epsilon = 1e-7;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross =
      (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
    if (Math.abs(cross) > epsilon) continue;
    const dot =
      (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
    const lengthSquared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (dot >= -epsilon && dot <= lengthSquared + epsilon) return true;
  }
  return false;
}

export function boundsInsidePolygon(bounds, polygon) {
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.depth },
    { x: bounds.x, y: bounds.y + bounds.depth },
  ];
  return corners.every((corner) => pointInPolygon(corner, polygon));
}

export function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
