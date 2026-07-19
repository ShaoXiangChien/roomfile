#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  failInput,
  isValidStyleContext,
  parseArgs,
  printResult,
  readJson,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const atlasRoot = path.resolve(scriptDirectory, "../references/style-atlas");

try {
  if (!args.request) throw new Error("--request is required");
  const requestPath = path.resolve(String(args.request));
  const request = await readJson(requestPath);
  const adapter = String(args.adapter || "banana");
  if (!["banana", "generic"].includes(adapter)) {
    throw new Error("--adapter must be banana or generic");
  }
  validateRequest(request);

  const outputPath = path.resolve(
    String(args.output || path.join(path.dirname(requestPath), "render-brief.md")),
  );
  const style = await resolveStyleContext(request.style_context);
  const brief = buildBrief(request, requestPath, adapter, style);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, brief);

  printResult(result("success", [], [], [outputPath]), asJson);
} catch (error) {
  failInput(error, asJson);
}

function validateRequest(request) {
  if (!request || typeof request !== "object") {
    throw new Error("render request must be a JSON object");
  }
  for (const field of ["concept_id", "goal", "camera_view", "output", "disclaimer"]) {
    if (typeof request[field] !== "string" || request[field].trim() === "") {
      throw new Error(`${field} must be a non-empty string`);
    }
  }
  for (const field of [
    "canonical_images",
    "locked_facts",
    "allowed_changes",
    "style_evidence",
    "product_references",
  ]) {
    if (!Array.isArray(request[field])) {
      throw new Error(`${field} must be an array`);
    }
  }
  if (request.locked_facts.length === 0) {
    throw new Error("locked_facts must contain at least one room-truth constraint");
  }
  if (!Number.isInteger(request.concept_version) || request.concept_version < 1) {
    throw new Error("concept_version must be a positive integer");
  }
  if (
    Object.hasOwn(request, "style_context") &&
    !isValidStyleContext(request.style_context)
  ) {
    throw new Error("style_context must use the complete v0.3 style-context contract");
  }
}

async function resolveStyleContext(styleContext) {
  if (!styleContext) {
    return {
      userOverrides: [],
      adoptedSignals: [],
      packGuidance: [],
      negativeGuidance: [],
      referenceImages: [],
    };
  }

  const index = await readJson(path.join(atlasRoot, "index.json"));
  const packs = new Map(index.packs.map((pack) => [pack.id, pack]));
  const packGuidance = [];
  const negativeGuidance = styleContext.rejected_signals.map(formatSignal);

  for (const reference of styleContext.pack_refs) {
    const pack = packs.get(reference.id);
    if (!pack) {
      throw new Error(`style_context pack "${reference.id}" is not declared in the Style Atlas`);
    }
    const signals = await readJson(
      path.join(atlasRoot, portableRelative(pack.path, "pack path"), "signals.json"),
    );
    packGuidance.push(
      ...stringArray(signals.positive_prompt_guidance, `${pack.id} positive guidance`),
    );
    negativeGuidance.push(
      ...stringArray(signals.cliches_to_avoid, `${pack.id} clichés`),
      ...stringArray(signals.negative_prompt_guidance, `${pack.id} negative guidance`),
    );
  }

  const referenceImages = [];
  for (const reference of styleContext.reference_images) {
    const safeRequestedPath = portableRelative(reference.path, "reference image path");
    const pack = packs.get(reference.pack_id);
    if (!pack) {
      throw new Error(
        `reference image pack "${reference.pack_id}" is not declared in the Style Atlas`,
      );
    }
    if (!styleContext.pack_refs.some((packRef) => packRef.id === reference.pack_id)) {
      throw new Error(
        `reference image pack mismatch: "${reference.pack_id}" is absent from pack_refs`,
      );
    }
    const packDirectory = path.join(atlasRoot, portableRelative(pack.path, "pack path"));
    const visualManifest = await readJson(path.join(packDirectory, "visuals.json"));
    const visual = visualManifest.visuals?.find(
      (candidate) => candidate.id === reference.visual_id,
    );
    if (!visual) {
      throw new Error(
        `visual ID "${reference.visual_id}" is not declared by pack "${reference.pack_id}"`,
      );
    }
    const declaredPath = portableRelative(visual.path, "declared visual path");
    if (declaredPath !== safeRequestedPath) {
      throw new Error(
        `reference image path "${reference.path}" does not match the path declared for visual ID "${reference.visual_id}"`,
      );
    }
    const absolutePath = path.resolve(packDirectory, declaredPath);
    if (!isWithin(packDirectory, absolutePath)) {
      throw new Error(`declared visual path for "${reference.visual_id}" escapes its pack`);
    }
    await access(absolutePath);
    referenceImages.push({
      path: absolutePath,
      reason: reference.reason,
      packId: reference.pack_id,
      visualId: reference.visual_id,
    });
  }

  return {
    userOverrides: styleContext.user_overrides.map(formatSignal),
    adoptedSignals: styleContext.adopted_signals.map(formatSignal),
    packGuidance,
    negativeGuidance,
    referenceImages,
  };
}

function buildBrief(request, requestPath, adapter, style) {
  const requestDirectory = path.dirname(requestPath);
  const assetBase =
    path.basename(path.dirname(requestDirectory)) === "concepts"
      ? path.resolve(requestDirectory, "../..")
      : requestDirectory;
  const canonicalImages = request.canonical_images.map((image) =>
    path.resolve(assetBase, image),
  );
  const outputImage = path.resolve(assetBase, request.output);
  const title = adapter === "banana" ? "Banana render brief" : "Render brief";
  const continuity =
    adapter === "banana"
      ? "For a refinement, pass the latest valid `previous_interaction_id` to Banana. For the first render, attach the canonical image paths below. Never ask the user to upload a local image again."
      : "Continue from the provider's latest valid interaction when available. Otherwise attach the canonical image paths below.";

  return `# ${title}

Generated from \`${requestPath}\`. The JSON request remains the source of truth.

## Provider contract

- Adapter: ${adapter}
- Concept: ${request.concept_id} v${request.concept_version}
- Output: \`${outputImage}\`
- Continuity: ${continuity}
- Privacy: for a private project, confirm consent before sending room images to a provider not already approved in the project.

## Private canonical room inputs

${list(canonicalImages.length > 0 ? canonicalImages : ["No canonical image recorded. Stop and capture one before rendering."])}

## Public Style Atlas reference images

${atlasReferences(style.referenceImages)}

These public references are style evidence only. They do not replace the canonical room inputs or provider consent for private room photos.

## Provider-ready prompt

Create a photorealistic interior-design visualization using the supplied canonical room image as the architectural source of truth.

Goal: ${request.goal}

Camera and composition: ${request.camera_view} Keep this viewpoint, framing, perspective, lens character, and visible architecture consistent.

### 1. Room locks

You MUST preserve every locked fact exactly:
${numbered(request.locked_facts)}

Allowed edits only:
${numbered(request.allowed_changes, "No decorative changes are authorized.")}

### 2. User overrides

${numbered(style.userOverrides, "No user override was recorded.")}

### 3. Adopted style signals

${numbered(style.adoptedSignals, "No Atlas signal was adopted.")}

### 4. Legacy style evidence

${numbered(request.style_evidence, "No style evidence was recorded.")}

### 5. General pack guidance

${numbered(style.packGuidance, "No built-in pack guidance applies.")}

### Negative guidance

The following rejected signals and pack clichés are exclusions only. Do not introduce them as positive design requirements. If negative guidance conflicts with an earlier user override, the user override wins:
${numbered(style.negativeGuidance, "No negative style guidance was recorded.")}

Product references to depict approximately, without inventing dimensional proof:
${numbered(request.product_references, "No product reference was supplied.")}

Do not move, remove, resize, or redesign locked walls, doors, windows, flooring, ceiling, outlets, radiators, HVAC vents, fixed lighting, retained inventory, or the camera. Do not add permanent construction. Treat every image as a visual approximation; deterministic fit checks and structured measurements remain authoritative.

No text, watermark, labels, captions, split-screen treatment, people, or impossible geometry in the generated image.

## Metadata to store beside the image

Record this disclaimer in the concept file and user-facing presentation:

> ${request.disclaimer}

Do NOT render the disclaimer or any other text inside the image.
`;
}

function numbered(items, emptyMessage = "None recorded.") {
  if (items.length === 0) return `1. ${emptyMessage}`;
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function list(items) {
  return items.map((item) => `- \`${item}\``).join("\n");
}

function atlasReferences(items) {
  if (items.length === 0) return "- None selected.";
  return items
    .map(
      (item) =>
        `- \`${item.path}\` — ${item.packId} / ${item.visualId}: ${item.reason}`,
    )
    .join("\n");
}

function formatSignal(value) {
  if (typeof value === "string") return value;
  const details = [
    value.reason ? `reason: ${value.reason}` : "",
    value.source ? `source: ${value.source}` : "",
  ].filter(Boolean);
  return details.length > 0 ? `${value.signal} (${details.join("; ")})` : value.signal;
}

function stringArray(value, label) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  return value;
}

function portableRelative(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  if (path.isAbsolute(value)) {
    throw new Error(`${label} must not be absolute`);
  }
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`${label} contains path traversal`);
  }
  return normalized;
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
