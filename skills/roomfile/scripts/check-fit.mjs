#!/usr/bin/env node
import path from "node:path";
import {
  boundsInsidePolygon,
  failInput,
  parseArgs,
  printResult,
  productBounds,
  readJson,
  rectanglesOverlap,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  if (!args.geometry || !args.products) {
    throw new Error("--geometry and --products are required");
  }
  const geometryPath = path.resolve(String(args.geometry));
  const productsPath = path.resolve(String(args.products));
  const geometry = await readJson(geometryPath);
  const catalog = await readJson(productsPath);
  const errors = [];
  const warnings = [];
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const boundary = geometry?.boundary?.points ?? [];
  const evaluated = [];

  for (const product of products) {
    const bounds = productBounds(product);
    if (
      !product.id ||
      !Number.isFinite(bounds.x) ||
      !Number.isFinite(bounds.y) ||
      !Number.isFinite(bounds.width) ||
      !Number.isFinite(bounds.depth)
    ) {
      errors.push({
        code: "invalid_product_geometry",
        product_id: product.id || null,
        message: `${product.name || product.id || "Product"} has incomplete dimensions or placement.`,
      });
      continue;
    }
    evaluated.push({ product, bounds });
    if (!boundsInsidePolygon(bounds, boundary)) {
      errors.push({
        code: "outside_boundary",
        product_id: product.id,
        message: `${product.name || product.id} extends outside the measured room boundary.`,
      });
    }
  }

  for (let left = 0; left < evaluated.length; left += 1) {
    for (let right = left + 1; right < evaluated.length; right += 1) {
      if (rectanglesOverlap(evaluated[left].bounds, evaluated[right].bounds)) {
        errors.push({
          code: "product_overlap",
          product_ids: [evaluated[left].product.id, evaluated[right].product.id],
          message: `${evaluated[left].product.name || evaluated[left].product.id} overlaps ${evaluated[right].product.name || evaluated[right].product.id}.`,
        });
      }
    }
  }

  const clearanceZones = [
    ...(geometry.clearance_zones ?? []),
    ...(geometry.openings ?? [])
      .filter((opening) => opening.clearance)
      .map((opening) => ({ id: `${opening.id}-clearance`, ...opening.clearance })),
  ];
  for (const { product, bounds } of evaluated) {
    for (const zone of clearanceZones) {
      const zoneBounds = {
        x: Number(zone.x),
        y: Number(zone.y),
        width: Number(zone.width),
        depth: Number(zone.depth),
      };
      if (rectanglesOverlap(bounds, zoneBounds)) {
        errors.push({
          code: "clearance_conflict",
          product_id: product.id,
          zone_id: zone.id,
          message: `${product.name || product.id} blocks clearance zone ${zone.id}.`,
        });
      }
    }
  }

  const payload = result(
    errors.length > 0 ? "invalid" : "success",
    errors,
    warnings,
    [geometryPath, productsPath],
  );
  printResult(payload, asJson);
  process.exitCode = errors.length > 0 ? 1 : 0;
} catch (error) {
  failInput(error, asJson);
}
