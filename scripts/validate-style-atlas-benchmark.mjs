#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectImage } from "../skills/roomfile/scripts/image-validation.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);
const errors = [];
const warnings = [];
const artifacts = [];

try {
  if (!args.benchmark) throw new Error("--benchmark is required");
  const root = path.resolve(String(args.benchmark));
  const benchmark = await json(path.join(root, "benchmark.json"));
  const locksPath = path.join(root, "locks.json");
  const locks = await json(locksPath);
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

    await validateCallProvenance({
      root,
      generation,
      benchmark,
      locks,
      locksPath,
      pair,
      packRoot: path.resolve(atlasRoot, pack.path),
      variants: [
        {
          name: "baseline",
          request: baseline,
          requestPath: baselinePath,
          promptPath: baselinePromptPath,
        },
        {
          name: "guided",
          request: guided,
          requestPath: guidedPath,
          promptPath: guidedPromptPath,
        },
      ],
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
        true,
        {
          formats: ["JPEG"],
          width: locks.render_contract?.output_dimensions?.width,
          height: locks.render_contract?.output_dimensions?.height,
          minByteSize: 100_000,
          minScanBytes: 10_000,
        },
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
    true,
    { minByteSize: 100_000 },
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
  if (
    locks.render_contract?.fresh_source_edit_per_call !== true
    || locks.render_contract?.chained_edits !== false
    || locks.render_contract?.aspect_ratio !== "4:3"
    || locks.render_contract?.output_resolution !== "2K"
    || locks.render_contract?.output_dimensions?.width !== 2400
    || locks.render_contract?.output_dimensions?.height !== 1792
  ) {
    issue(
      "generation_provenance_mismatch",
      "Render contract must require independent fresh-source edits at 2400 × 1792 (2K, 4:3).",
    );
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
  if (
    !Array.isArray(guided.style_context?.reference_images)
    || guided.style_context.reference_images.length < 1
  ) {
    issue("guided_pack_mismatch", `${pair.style_id} guided request needs at least one reference image.`);
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

async function validateCallProvenance({
  root,
  generation,
  benchmark,
  locks,
  locksPath,
  pair,
  packRoot,
  variants,
}) {
  const sourcePath = internal(root, benchmark.source, "canonical source");
  const sourceSha = await fileHash(sourcePath);
  const locksSha = await fileHash(locksPath);
  if (
    generation.source !== benchmark.source
    || generation.source_sha256 !== sourceSha
    || generation.route !== "fresh_source_edit"
    || locks.source !== benchmark.source
  ) {
    issue(
      "generation_provenance_mismatch",
      "Generation must bind the canonical source and fresh-source route.",
    );
  }

  const visuals = await json(path.join(packRoot, "visuals.json"));
  for (const variant of variants) {
    const output = variant.name === "baseline" ? pair.baseline_output : pair.guided_output;
    const call = generation.calls?.find(
      (item) => item.run_id === `${pair.style_id}-${variant.name}`,
    );
    const requestRelative = normalize(path.relative(root, variant.requestPath));
    const promptRelative = normalize(path.relative(root, variant.promptPath));
    const expectedReferences = [];
    for (const reference of variant.request.style_context?.reference_images || []) {
      const visual = visuals.visuals?.find((item) => item.id === reference.visual_id);
      if (!visual) continue;
      const imagePath = path.resolve(packRoot, visual.path);
      const actualSha = await fileHash(imagePath);
      if (actualSha !== visual.sha256) {
        issue(
          "generation_provenance_mismatch",
          `${pair.style_id} reference ${visual.id} does not match its pack hash.`,
        );
      }
      expectedReferences.push({
        pack_id: pair.style_id,
        visual_id: visual.id,
        path: visual.path,
        sha256: visual.sha256,
      });
    }
    const outputPath = internal(root, output, `${variant.name} output`);
    const outputSha = await optionalFileHash(outputPath);
    const valid = (
      call
      && call.style_id === pair.style_id
      && call.variant === variant.name
      && normalize(call.output) === normalize(output)
      && call.fresh_source_edit === true
      && call.parent_interaction_id === null
      && equal(call.source, { path: benchmark.source, sha256: sourceSha })
      && equal(call.request, {
        path: requestRelative,
        sha256: await fileHash(variant.requestPath),
      })
      && equal(call.prompt, {
        path: promptRelative,
        sha256: await fileHash(variant.promptPath),
      })
      && equal(call.locks, { path: "locks.json", sha256: locksSha })
      && outputSha !== null
      && call.output_sha256 === outputSha
      && equal(call.attached_reference_visuals, expectedReferences)
      && (variant.name !== "guided" || expectedReferences.length > 0)
      && (variant.name !== "baseline" || expectedReferences.length === 0)
    );
    if (!valid) {
      issue(
        "generation_provenance_mismatch",
        `${pair.style_id} ${variant.name} does not reconcile immutable inputs or independent-call state.`,
      );
    }
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

async function validateImage(file, missingCode, label, record = true, options = {}) {
  let bytes;
  try {
    bytes = await readFile(file);
  } catch {
    issue(missingCode, `${label} image is missing.`, file);
    return;
  }
  try {
    const parsed = inspectImage(bytes, options);
    if (record) artifacts.push(file);
    return parsed;
  } catch (error) {
    const code = (
      options.width
      && options.height
      && /Expected (?:width|height)/.test(error.message)
    ) ? "output_contract_mismatch" : "malformed_image";
    issue(code, `${label} is not a valid image: ${error.message}`, file);
    return null;
  }
}

async function fileHash(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function optionalFileHash(file) {
  try {
    return await fileHash(file);
  } catch {
    return null;
  }
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
