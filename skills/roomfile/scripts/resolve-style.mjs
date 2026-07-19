#!/usr/bin/env node
import path from "node:path";
import { failInput, parseArgs, printResult, readJson, result } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  if (!args.style || typeof args.style !== "string") throw new Error("--style is required");
  const atlas = path.resolve(String(args.atlas || "references/style-atlas"));
  const indexPath = path.join(atlas, "index.json");
  const index = await readJson(indexPath);
  if (!Array.isArray(index?.packs)) throw new Error(`${indexPath} must contain a packs array`);
  const requested = normalize(args.style);
  if (!requested) throw new Error("--style must contain letters or numbers");
  const pack = index.packs.find((entry) =>
    [entry?.id, entry?.name, ...(Array.isArray(entry?.aliases) ? entry.aliases : [])]
      .some((candidate) => normalize(candidate) === requested),
  );
  if (pack) {
    printResult({ ...result("success", [], [], [indexPath]), pack }, asJson);
  } else {
    printResult(
      { ...result("needs-live-research", [], [], [indexPath]), style: args.style },
      asJson,
    );
  }
} catch (error) {
  failInput(error, asJson);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{M}\p{N}]+/gu, "");
}
