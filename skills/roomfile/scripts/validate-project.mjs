#!/usr/bin/env node
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import {
  SCHEMA_VERSION,
  failInput,
  parseArgs,
  printResult,
  readJson,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  if (!args.project) throw new Error("--project is required");
  const project = path.resolve(String(args.project));
  const errors = [];
  const warnings = [];
  const artifacts = [];
  const manifestPath = path.join(project, "roomfile.json");
  const manifest = await inspectJson(manifestPath, "manifest_missing");

  if (manifest) {
    if (manifest.schema_version !== SCHEMA_VERSION) {
      errors.push({
        code: "unsupported_schema_version",
        message: `Expected schema ${SCHEMA_VERSION}; received ${manifest.schema_version}.`,
      });
    }
    for (const field of [
      "country",
      "currency",
      "measurement_unit",
      "privacy_mode",
      "preferred_retailers",
      "rooms",
    ]) {
      if (manifest[field] === undefined) {
        errors.push({
          code: "manifest_field_missing",
          field,
          message: `roomfile.json is missing ${field}.`,
        });
      }
    }
  }

  for (const room of manifest?.rooms ?? []) {
    const roomPath = path.join(project, "rooms", room.id);
    const geometryPath = path.join(roomPath, "geometry.json");
    const factsPath = path.join(roomPath, "facts.json");
    const productsPath = path.join(roomPath, "products.json");
    const geometry = await inspectJson(geometryPath, "geometry_missing");
    const facts = await inspectJson(factsPath, "facts_missing");
    const products = await inspectJson(productsPath, "products_missing");

    if ((geometry?.boundary?.points ?? []).length < 3) {
      errors.push({
        code: "invalid_boundary",
        room_id: room.id,
        message: `${room.id} needs a measured polygon with at least three points.`,
      });
    }
    for (const fact of facts?.facts ?? []) {
      if (fact.critical_for_fit && fact.classification !== "measured") {
        errors.push({
          code: "critical_fact_not_measured",
          fact_id: fact.id,
          message: `${fact.label || fact.id} is critical for fit but classified as ${fact.classification}.`,
        });
      }
    }
    for (const product of products?.products ?? []) {
      if (
        product.status === "approved" &&
        (!product.dimensions?.width ||
          !product.dimensions?.depth ||
          !product.source?.url ||
          !product.source?.retrieved_at)
      ) {
        errors.push({
          code: "approved_product_unverified",
          product_id: product.id,
          message: `${product.name || product.id} is approved without verified dimensions and dated source evidence.`,
        });
      }
      if (
        product.status === "approved" &&
        product.approval?.approved_by_user !== true
      ) {
        errors.push({
          code: "approved_product_missing_user_approval",
          product_id: product.id,
          message: `${product.name || product.id} is approved without an explicit user approval record.`,
        });
      }
    }

    const conceptsPath = path.join(roomPath, "concepts");
    for (const entry of await directories(conceptsPath)) {
      const concept = await inspectJson(
        path.join(conceptsPath, entry.name, "concept.json"),
        "concept_missing",
      );
      if (
        concept?.status === "approved" &&
        !concept.decisions?.some((decision) => decision.approved_by_user === true)
      ) {
        errors.push({
          code: "approved_concept_missing_user_approval",
          concept_id: concept.id || entry.name,
          message: `${concept.style_direction || concept.id || entry.name} is approved without an explicit user-approved decision.`,
        });
      }
    }
  }

  const payload = result(
    errors.length > 0 ? "invalid" : "success",
    errors,
    warnings,
    artifacts,
  );
  printResult(payload, asJson);
  process.exitCode = errors.length > 0 ? 1 : 0;

  async function inspectJson(file, code) {
    try {
      await access(file);
      const value = await readJson(file);
      artifacts.push(file);
      if (value.schema_version !== SCHEMA_VERSION) {
        errors.push({
          code: "unsupported_schema_version",
          file,
          message: `${file} uses unsupported schema ${value.schema_version}.`,
        });
      }
      return value;
    } catch (error) {
      errors.push({
        code,
        file,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async function directories(directory) {
    try {
      return (await readdir(directory, { withFileTypes: true })).filter((entry) =>
        entry.isDirectory(),
      );
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }
} catch (error) {
  failInput(error, asJson);
}
