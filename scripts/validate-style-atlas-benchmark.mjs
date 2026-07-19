#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);
const errors = [];
const warnings = [];
const artifacts = [];

try {
  if (!args.benchmark) throw new Error("--benchmark is required");
  const root = path.resolve(String(args.benchmark));
  const benchmark = await json(path.join(root, "benchmark.json"));
  const locks = await json(path.join(root, "locks.json"));
  const estimate = await json(path.join(root, "cost-estimate.json"));
  const generation = await json(path.join(root, "generation-log.json"));
  const review = await json(path.join(root, "review.json"));
  const atlasIndexPath = args.atlas
    ? path.resolve(String(args.atlas))
    : path.resolve(root, String(benchmark.atlas_index));
  const atlasRoot = path.dirname(atlasIndexPath);
  const atlasIndex = await json(atlasIndexPath);
  const atlasPacks = new Map(atlasIndex.packs?.map((pack) => [pack.id, pack]) || []);

  validateTopLevel(benchmark, locks, estimate);
  const expectedOutputs = [];

  for (const pair of benchmark.pairs || []) {
    const pack = atlasPacks.get(pair.style_id);
    if (!pack) {
      issue("guided_pack_mismatch", `Unknown Atlas pack "${pair.style_id}".`);
      continue;
    }
    if (pack.version !== pair.pack_version) {
      issue(
        "guided_pack_mismatch",
        `${pair.style_id} declares ${pair.pack_version}, but the Atlas index declares ${pack.version}.`,
      );
    }

    const baselinePath = internal(root, pair.baseline_request, "baseline request");
    const guidedPath = internal(root, pair.guided_request, "guided request");
    const baselinePromptPath = internal(root, pair.baseline_prompt, "baseline prompt");
    const guidedPromptPath = internal(root, pair.guided_prompt, "guided prompt");
    const baseline = await json(baselinePath);
    const guided = await json(guidedPath);
    const baselinePrompt = await readFile(baselinePromptPath, "utf8");
    const guidedPrompt = await readFile(guidedPromptPath, "utf8");

    await validatePair({
      root,
      locks,
      pair,
      pack,
      packRoot: path.resolve(atlasRoot, pack.path),
      baseline,
      guided,
      baselinePrompt,
      guidedPrompt,
    });

    for (const [variant, output] of [
      ["baseline", pair.baseline_output],
      ["guided", pair.guided_output],
    ]) {
      const outputPath = internal(root, output, `${variant} output`);
      expectedOutputs.push(normalize(output));
      const parsedImage = await validateImage(
        outputPath,
        "missing_output",
        `${pair.style_id} ${variant}`,
      );
      const call = generation.calls?.find(
        (item) => normalize(item.output) === normalize(output),
      );
      if (parsedImage && !equal(call?.actual_image, parsedImage)) {
        issue(
          "generation_log_mismatch",
          `${pair.style_id} ${variant} parsed image metadata does not match its generation record.`,
        );
      }
    }
  }

  await validateImage(
    internal(root, benchmark.source, "source"),
    "missing_source",
    "canonical source",
  );
  validateGeneration(generation, estimate, expectedOutputs);
  validateReview(review, benchmark.pairs || []);
  validatePublicMetadata({
    benchmark,
    locks,
    estimate,
    generation,
    review,
    requests: await Promise.all(
      (benchmark.pairs || []).flatMap((pair) => [
        json(internal(root, pair.baseline_request, "baseline request")),
        json(internal(root, pair.guided_request, "guided request")),
      ]),
    ),
  });

  const status = errors.length ? "invalid" : "success";
  print({ status, errors, warnings, artifacts });
  process.exitCode = errors.length ? 1 : 0;
} catch (error) {
  const payload = {
    status: "error",
    errors: [{ code: "malformed_input", message: error.message }],
    warnings,
    artifacts,
  };
  print(payload);
  process.exitCode = 2;
}

function validateTopLevel(benchmark, locks, estimate) {
  if (benchmark.schema_version !== "0.3.0" || locks.schema_version !== "0.3.0") {
    issue("schema_version_mismatch", "Benchmark and locks must use schema version 0.3.0.");
  }
  const expectedStyles = ["bauhaus", "japandi", "mid-century-modern"];
  const actualStyles = (benchmark.pairs || []).map((pair) => pair.style_id).sort();
  if (JSON.stringify(actualStyles) !== JSON.stringify(expectedStyles)) {
    issue("benchmark_matrix_mismatch", "Benchmark must contain one pair for each initial Atlas pack.");
  }
  if (benchmark.source !== locks.source) {
    issue("pair_contract_mismatch", "Benchmark and locks must reference the same source.");
  }
  if (!Array.isArray(locks.locked_facts) || locks.locked_facts.length < 8) {
    issue("incomplete_locks", "locks.json must preserve complete room and inventory truth.");
  }
  if (estimate.planned_calls !== 6) {
    issue("cost_estimate_mismatch", "Cost estimate must cover exactly six calls.");
  }
  const calculated = Number(
    (estimate.planned_calls * estimate.estimated_output_cost_per_image).toFixed(6),
  );
  if (calculated !== estimate.estimated_output_cost) {
    issue("cost_estimate_mismatch", "Estimated call count and unit cost do not reconcile.");
  }
}

async function validatePair({
  root,
  locks,
  pair,
  pack,
  packRoot,
  baseline,
  guided,
  baselinePrompt,
  guidedPrompt,
}) {
  for (const [label, request] of [
    ["baseline", baseline],
    ["guided", guided],
  ]) {
    const source = request.canonical_images?.[0];
    const resolvedSource = path.resolve(
      path.dirname(
        internal(
          root,
          label === "baseline" ? pair.baseline_request : pair.guided_request,
          `${label} request`,
        ),
      ),
      String(source),
    );
    if (
      request.canonical_images?.length !== 1
      || resolvedSource !== path.resolve(root, locks.source)
      || !equal(request.locked_facts, locks.locked_facts)
      || !equal(request.allowed_changes, locks.allowed_changes)
      || request.camera_view !== locks.camera_view
    ) {
      issue(
        "pair_contract_mismatch",
        `${pair.style_id} ${label} does not use the common source, locks, allowed changes, and camera.`,
      );
    }
  }
  if (!equal(baseline.style_evidence, guided.style_evidence)) {
    issue(
      "pair_contract_mismatch",
      `${pair.style_id} baseline and guided requests must use identical resident evidence.`,
    );
  }
  if (
    Object.hasOwn(baseline, "style_context")
    || /\bStyle Atlas\b|\bAtlas release snapshot\b|references\/style-atlas|@0\.3\.0/i.test(
      baselinePrompt,
    )
  ) {
    issue("baseline_uses_atlas", `${pair.style_id} baseline includes Atlas-only guidance.`);
  }

  const signals = await json(path.join(packRoot, "signals.json"));
  for (const value of [
    ...(signals.positive_prompt_guidance || []),
    ...(signals.negative_prompt_guidance || []),
    ...(signals.cliches_to_avoid || []),
  ]) {
    if (baselinePrompt.includes(value)) {
      issue(
        "baseline_uses_atlas",
        `${pair.style_id} baseline copies a pack-only guidance sentence.`,
      );
    }
  }

  const packRefs = guided.style_context?.pack_refs;
  if (
    !Array.isArray(packRefs)
    || packRefs.length !== 1
    || packRefs[0]?.id !== pair.style_id
    || packRefs[0]?.version !== pair.pack_version
    || pack.version !== pair.pack_version
  ) {
    issue(
      "guided_pack_mismatch",
      `${pair.style_id} guided request must reference ${pair.style_id}@${pair.pack_version}.`,
    );
  }
  if (!guidedPrompt.includes(`Atlas release snapshot: ${pair.style_id}@${pair.pack_version}`)) {
    issue(
      "guided_pack_mismatch",
      `${pair.style_id} guided prompt is missing its exact pack/version marker.`,
    );
  }
  if (!Array.isArray(guided.style_context?.reference_images)) {
    issue("guided_pack_mismatch", `${pair.style_id} guided request lacks reference images.`);
  } else {
    const visuals = await json(path.join(packRoot, "visuals.json"));
    for (const reference of guided.style_context.reference_images) {
      const visual = visuals.visuals?.find((item) => item.id === reference.visual_id);
      if (
        reference.pack_id !== pair.style_id
        || !visual
        || visual.path !== reference.path
      ) {
        issue(
          "guided_pack_mismatch",
          `${pair.style_id} references an image outside its exact pack snapshot.`,
        );
        continue;
      }
      await validateImage(
        path.resolve(packRoot, reference.path),
        "guided_pack_mismatch",
        `${pair.style_id}/${reference.visual_id}`,
        false,
      );
    }
  }

  const baselineExpected = path.resolve(
    path.dirname(internal(root, pair.baseline_request, "baseline request")),
    baseline.output,
  );
  const guidedExpected = path.resolve(
    path.dirname(internal(root, pair.guided_request, "guided request")),
    guided.output,
  );
  if (
    baselineExpected !== internal(root, pair.baseline_output, "baseline output")
    || guidedExpected !== internal(root, pair.guided_output, "guided output")
  ) {
    issue("generation_log_mismatch", `${pair.style_id} request outputs do not match the matrix.`);
  }
}

function validateGeneration(generation, estimate, expectedOutputs) {
  const calls = Array.isArray(generation.calls) ? generation.calls : [];
  const outputSet = calls.map((call) => normalize(call.output)).sort();
  if (
    !dateTime(estimate.estimated_at)
    || calls.some(
      (call) =>
        dateTime(call.timestamp)
        && Date.parse(estimate.estimated_at) >= Date.parse(call.timestamp),
    )
  ) {
    issue("cost_estimate_mismatch", "Cost estimate must be timestamped before every generation call.");
  }
  if (
    calls.length !== 6
    || !equal(outputSet, [...expectedOutputs].sort())
    || calls.some(
      (call) =>
        call.status !== "completed"
        || !dateTime(call.timestamp)
        || typeof call.provider_interaction_id !== "string"
        || !call.provider_interaction_id.trim(),
    )
    || generation.totals?.calls !== 6
    || !dateTime(generation.generated_at)
  ) {
    issue(
      "generation_log_mismatch",
      "Generation log must reconcile six completed, timestamped calls and outputs.",
    );
  }
  if (
    generation.model !== estimate.model
    || generation.resolution !== estimate.resolution
    || generation.aspect_ratio !== estimate.aspect_ratio
    || generation.totals?.currency !== estimate.currency
    || generation.totals?.estimated_output_cost_usd !== estimate.estimated_output_cost
    || calls.some(
      (call) =>
        call.estimated_output_cost_usd !== estimate.estimated_output_cost_per_image,
    )
  ) {
    issue("generation_log_mismatch", "Generation settings do not match the cost estimate.");
  }
  const costs = calls.map((call) => call.actual_cost_usd);
  const reported = costs.filter((value) => typeof value === "number");
  if (reported.length === calls.length) {
    const sum = Number(reported.reduce((total, value) => total + value, 0).toFixed(6));
    if (generation.totals?.reported_actual_cost_usd !== sum) {
      issue("generation_log_mismatch", "Reported actual costs do not reconcile.");
    }
  } else if (
    costs.some((value) => value !== null)
    || generation.totals?.reported_actual_cost_usd !== null
  ) {
    issue(
      "generation_log_mismatch",
      "Actual cost must be fully reported and reconciled or consistently null.",
    );
  }
}

function validateReview(review, pairs) {
  const criteria = [
    "style_depth",
    "room_preservation",
    "material_differentiation",
    "cliche_avoidance",
    "evidence_subordination",
  ];
  if (
    review.review_status !== "complete"
    || !dateTime(review.reviewed_at)
    || !Array.isArray(review.pairs)
    || review.pairs.length !== pairs.length
  ) {
    issue("incomplete_review", "Human benchmark review is incomplete.");
    return;
  }
  for (const pair of pairs) {
    const record = review.pairs.find((item) => item.style_id === pair.style_id);
    for (const variant of ["baseline", "guided"]) {
      const result = record?.[variant];
      if (
        !result
        || criteria.some(
          (criterion) =>
            !Number.isInteger(result.scores?.[criterion])
            || result.scores[criterion] < 1
            || result.scores[criterion] > 5,
        )
        || !Array.isArray(result.observations)
        || result.observations.length === 0
        || !Array.isArray(result.failure_modes)
      ) {
        issue(
          "incomplete_review",
          `${pair.style_id} ${variant} needs complete scores and observable review notes.`,
        );
      }
    }
  }
}

function validatePublicMetadata(value) {
  const text = JSON.stringify(value);
  const patterns = [
    /\b(?:AIza|AQ\.)[A-Za-z0-9_-]{24,}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /(?:^|["\s])\/Users\//,
    /(?:^|["\s])\/home\//,
    /(?:^|["\s])\/(?:tmp|var\/folders)\//,
    /[A-Za-z]:\\Users\\/i,
  ];
  if (patterns.some((pattern) => pattern.test(text))) {
    issue("private_metadata", "Public benchmark metadata contains a secret or private path.");
  }
}

async function validateImage(file, missingCode, label, record = true) {
  let bytes;
  try {
    bytes = await readFile(file);
  } catch {
    issue(missingCode, `${label} image is missing.`, file);
    return;
  }
  try {
    const parsed = imageStructure(bytes);
    if (record) artifacts.push(file);
    return parsed;
  } catch (error) {
    issue("malformed_image", `${label} is not a structurally valid image: ${error.message}`, file);
    return null;
  }
}

function imageStructure(bytes) {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.subarray(0, 8).equals(png)) return pngStructure(bytes);
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegStructure(bytes);
  throw new Error("unsupported signature");
}

function jpegStructure(bytes) {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("missing JPEG start");
  }
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;
  let sawFrame = false;
  let sawScan = false;
  let sawEntropy = false;
  let sawEnd = false;
  let frameWidth = 0;
  let frameHeight = 0;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("invalid JPEG marker");
    while (bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) throw new Error("truncated JPEG marker");
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9) {
      sawEnd = true;
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd8 || marker === 0x00 || offset + 2 > bytes.length) {
      throw new Error("invalid JPEG segment");
    }

    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      throw new Error("truncated JPEG segment");
    }
    if (startOfFrame.has(marker)) {
      if (length < 11) throw new Error("invalid JPEG frame");
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      const components = bytes[offset + 7];
      if (!width || !height || !components || length !== 8 + components * 3) {
        throw new Error("invalid JPEG frame");
      }
      frameWidth = width;
      frameHeight = height;
      sawFrame = true;
    }
    if (marker === 0xda) {
      if (!sawFrame || length < 8) throw new Error("invalid JPEG scan");
      sawScan = true;
      offset += length;
      const entropy = scanJpegEntropy(bytes, offset);
      sawEntropy ||= entropy.hasData;
      offset = entropy.offset;
      if (entropy.ended) {
        sawEnd = true;
        break;
      }
      continue;
    }
    offset += length;
  }

  if (!sawFrame || !sawScan || !sawEntropy || !sawEnd) {
    throw new Error("incomplete JPEG frame, scan, or end marker");
  }
  if (offset !== bytes.length && !(offset === bytes.length - 2 && bytes[offset] === 0xff)) {
    throw new Error("unexpected JPEG trailing data");
  }
  return { format: "JPEG", width: frameWidth, height: frameHeight };
}

function scanJpegEntropy(bytes, start) {
  let offset = start;
  let hasData = false;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      hasData = true;
      offset += 1;
      continue;
    }
    if (offset + 1 >= bytes.length) throw new Error("truncated JPEG scan");
    let markerOffset = offset + 1;
    while (bytes[markerOffset] === 0xff) markerOffset += 1;
    if (markerOffset >= bytes.length) throw new Error("truncated JPEG scan marker");
    const marker = bytes[markerOffset];
    if (marker === 0x00) {
      hasData = true;
      offset = markerOffset + 1;
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset = markerOffset + 1;
      continue;
    }
    if (marker === 0xd9) {
      if (markerOffset + 1 !== bytes.length) {
        throw new Error("unexpected JPEG trailing data");
      }
      return { offset: bytes.length, hasData, ended: true };
    }
    return { offset, hasData, ended: false };
  }
  throw new Error("truncated JPEG scan");
}

function pngStructure(bytes) {
  let offset = 8;
  let sawHeader = false;
  let sawData = false;
  let sawEnd = false;
  let imageWidth = 0;
  let imageHeight = 0;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("truncated PNG chunk");
    if (!sawHeader && (type !== "IHDR" || length !== 13)) {
      throw new Error("missing PNG header");
    }
    if (type === "IHDR") {
      const width = bytes.readUInt32BE(offset + 8);
      const height = bytes.readUInt32BE(offset + 12);
      if (!width || !height) throw new Error("invalid PNG dimensions");
      imageWidth = width;
      imageHeight = height;
      sawHeader = true;
    }
    if (type === "IDAT" && length > 0) sawData = true;
    if (type === "IEND") {
      if (length !== 0 || end !== bytes.length) throw new Error("invalid PNG end");
      sawEnd = true;
      break;
    }
    offset = end;
  }
  if (!sawHeader || !sawData || !sawEnd) throw new Error("incomplete PNG");
  return { format: "PNG", width: imageWidth, height: imageHeight };
}

async function json(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function internal(root, value, label) {
  if (typeof value !== "string" || !value.trim() || path.isAbsolute(value)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const resolved = path.resolve(root, value);
  const relative = path.relative(root, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes the benchmark directory`);
  }
  return resolved;
}

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalize(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}

function dateTime(value) {
  return (
    typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && !Number.isNaN(Date.parse(value))
  );
}

function issue(code, message, artifact) {
  errors.push({ code, message, ...(artifact ? { artifact } : {}) });
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[name] = true;
    else {
      parsed[name] = next;
      index += 1;
    }
  }
  return parsed;
}

function print(payload) {
  const output = asJson ? JSON.stringify(payload, null, 2) : `${payload.status}\n`;
  process.stdout.write(output);
}
