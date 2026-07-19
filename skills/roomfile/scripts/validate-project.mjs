#!/usr/bin/env node
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import {
  SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
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
      warnings.push({
        code: "schema_upgrade_available",
        message: `Schema ${manifest.schema_version} is supported; migrate to ${SCHEMA_VERSION} when convenient.`,
      });
    }
    if (manifest.schema_version === SCHEMA_VERSION) {
      const missingProfile = [
        manifest.setup_status !== "ready",
        !manifest.country,
        !manifest.currency,
        !["in", "cm"].includes(manifest.measurement_unit),
        !["user-preferred", "agent-suggested"].includes(
          manifest.retailer_strategy,
        ),
      ].some(Boolean);
      if (missingProfile) {
        errors.push({
          code: "shopping_profile_incomplete",
          message:
            "Complete location, currency, units, and retailer strategy before sourcing.",
        });
      }
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
    if (manifest.schema_version === SCHEMA_VERSION) {
      const styleContext = await inspectJson(
        path.join(project, "inspiration", "style-context.json"),
        "style_context_missing",
      );
      if (styleContext && !validStyleContext(styleContext)) {
        errors.push({
          code: "invalid_style_context",
          message: "style-context.json must use the v0.3 style-context contract.",
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
      const issue = {
        code: "invalid_boundary",
        room_id: room.id,
        message: `${room.id} needs a measured polygon with at least three points.`,
      };
      if (
        manifest?.schema_version === SCHEMA_VERSION &&
        room.status === "capture-needed"
      ) {
        warnings.push({
          ...issue,
          code: "room_geometry_needed",
        });
      } else {
        errors.push(issue);
      }
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
      if (!SUPPORTED_SCHEMA_VERSIONS.has(value.schema_version)) {
        errors.push({
          code: "unsupported_schema_version",
          file,
          message: `${file} uses unsupported schema ${value.schema_version}; supported versions are 0.1.0, 0.2.0, and ${SCHEMA_VERSION}.`,
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

function validStyleContext(value) {
  if (value?.schema_version !== SCHEMA_VERSION) return false;
  for (const field of [
    "pack_refs",
    "adopted_signals",
    "rejected_signals",
    "uncertain_signals",
    "user_overrides",
    "contradictions",
    "live_research_sources",
    "reference_images",
  ]) {
    if (!Array.isArray(value[field])) return false;
  }
  if (value.reference_images.length > 4) return false;
  return value.pack_refs.every(
    (ref) =>
      ref &&
      typeof ref.id === "string" &&
      typeof ref.version === "string" &&
      typeof ref.read_at === "string",
  ) && value.reference_images.every(
    (image) =>
      image &&
      ["pack_id", "visual_id", "path", "reason"].every(
        (field) => typeof image[field] === "string" && image[field].trim(),
      ),
  );
}
