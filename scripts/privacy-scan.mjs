#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  ".next",
  ".wrangler",
]);
const binary = new Set([".png", ".jpg", ".jpeg", ".webp", ".woff", ".woff2"]);
const findings = [];
const patterns = [
  ["Google API key", /\b(?:AIza|AQ\.)[A-Za-z0-9_-]{24,}\b/g],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["Affiliate query", /[?&](?:tag|ascsubtag|ref)=[^)\s"'&]+/gi],
];

for (const file of await walk(root)) {
  if (binary.has(path.extname(file).toLowerCase())) continue;
  const text = await readFile(file, "utf8");
  for (const [label, regex] of patterns) {
    for (const match of text.matchAll(regex)) {
      findings.push({
        label,
        file: path.relative(root, file),
        sample: `${match[0].slice(0, 8)}…`,
      });
    }
  }
}

if (findings.length) {
  console.error(JSON.stringify({ status: "invalid", findings }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: "success", findings: [] }));
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}
