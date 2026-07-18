#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  failInput,
  parseArgs,
  printResult,
  readJson,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

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
  const brief = buildBrief(request, requestPath, adapter);
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
}

function buildBrief(request, requestPath, adapter) {
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

## Canonical inputs

${list(canonicalImages.length > 0 ? canonicalImages : ["No canonical image recorded. Stop and capture one before rendering."])}

## Provider-ready prompt

Create a photorealistic interior-design visualization using the supplied canonical room image as the architectural source of truth.

Goal: ${request.goal}

Camera and composition: ${request.camera_view} Keep this viewpoint, framing, perspective, lens character, and visible architecture consistent.

You MUST preserve every locked fact exactly:
${numbered(request.locked_facts)}

Allowed edits only:
${numbered(request.allowed_changes, "No decorative changes are authorized.")}

Visible style evidence to express:
${numbered(request.style_evidence, "No style evidence was recorded.")}

Product references to depict approximately, without inventing dimensional proof:
${numbered(request.product_references, "No product reference was supplied.")}

Do not move, remove, resize, or redesign locked walls, doors, windows, flooring, ceiling, outlets, radiators, HVAC vents, fixed lighting, retained inventory, or the camera. Do not add permanent construction. Treat product appearance and placement as a visual approximation; structured measurements and Roomfile's fit checker remain authoritative.

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
