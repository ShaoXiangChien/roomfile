#!/usr/bin/env node
import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SCHEMA_VERSION,
  failInput,
  parseArgs,
  printResult,
  result,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const asJson = Boolean(args.json);

try {
  const target = path.resolve(String(args.target || process.cwd()));
  const privacy = args.privacy || "private";
  if (!["private", "public-demo"].includes(privacy)) {
    throw new Error("--privacy must be private or public-demo");
  }

  const project = path.join(target, "roomfile");
  const manifestPath = path.join(project, "roomfile.json");
  if (await exists(manifestPath)) {
    const payload = result(
      "success",
      [],
      ["Project already exists; no files overwritten."],
      [manifestPath],
    );
    printResult(payload, asJson);
  } else {
    const room = path.join(project, "rooms", "living-room");
    const paths = [
      project,
      path.join(project, "inspiration", "screenshots"),
      path.join(room, "assets", "source"),
      path.join(room, "assets", "generated"),
      path.join(room, "concepts"),
      path.join(project, ".runtime"),
    ];
    await Promise.all(paths.map((directory) => mkdir(directory, { recursive: true })));

    const files = new Map([
      [
        manifestPath,
        {
          schema_version: SCHEMA_VERSION,
          project_name: "My apartment",
          country: "US",
          region: "",
          postal_code: "",
          currency: "USD",
          measurement_unit: "in",
          budget: { amount: 3000, currency: "USD" },
          privacy_mode: privacy,
          preferred_retailers: [
            "IKEA US",
            "Amazon US",
            "Target",
            "Wayfair",
            "Walmart",
            "The Home Depot",
            "Lowe's",
          ],
          rendering: {
            preferred_adapter: "banana",
            external_processing_consent: "ask-per-provider",
          },
          rooms: [{ id: "living-room", name: "Living room", status: "capture-needed" }],
        },
      ],
      [
        path.join(project, "inspiration", "index.json"),
        { schema_version: SCHEMA_VERSION, sources: [] },
      ],
      [
        path.join(room, "geometry.json"),
        {
          schema_version: SCHEMA_VERSION,
          unit: "in",
          boundary: {
            type: "polygon",
            points: [
              { x: 0, y: 0 },
              { x: 144, y: 0 },
              { x: 144, y: 120 },
              { x: 0, y: 120 },
            ],
          },
          openings: [],
          fixed_elements: [],
          clearance_zones: [],
        },
      ],
      [
        path.join(room, "facts.json"),
        { schema_version: SCHEMA_VERSION, facts: [] },
      ],
      [
        path.join(room, "products.json"),
        { schema_version: SCHEMA_VERSION, products: [] },
      ],
      [
        path.join(project, ".runtime", "render-sessions.json"),
        { schema_version: SCHEMA_VERSION, providers: {} },
      ],
    ]);

    const [
      roomfileTemplate,
      homeTemplate,
      styleTemplate,
      inventoryTemplate,
      roomTemplate,
      decisionsTemplate,
      shoppingTemplate,
      executionTemplate,
    ] = await Promise.all(
      [
        "ROOMFILE.md",
        "HOME.md",
        "STYLE.md",
        "INVENTORY.md",
        "ROOM.md",
        "DECISIONS.md",
        "SHOPPING.md",
        "EXECUTION.md",
      ].map(readTemplate),
    );

    const markdown = new Map([
      [
        path.join(project, "ROOMFILE.md"),
        roomfileTemplate,
      ],
      [
        path.join(project, "HOME.md"),
        homeTemplate,
      ],
      [
        path.join(project, "STYLE.md"),
        styleTemplate,
      ],
      [
        path.join(project, "INVENTORY.md"),
        inventoryTemplate,
      ],
      [
        path.join(room, "ROOM.md"),
        roomTemplate.replaceAll("{{ROOM_NAME}}", "Living room"),
      ],
      [
        path.join(room, "DECISIONS.md"),
        decisionsTemplate,
      ],
      [
        path.join(room, "SHOPPING.md"),
        shoppingTemplate,
      ],
      [
        path.join(room, "EXECUTION.md"),
        executionTemplate,
      ],
    ]);

    for (const [file, value] of files) {
      await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
    }
    for (const [file, value] of markdown) {
      await writeFile(file, value, { flag: "wx" });
    }

    if (privacy === "private") {
      await ensureGitignore(target);
    }

    const artifacts = [...files.keys(), ...markdown.keys()];
    const payload = result("success", [], [], artifacts);
    printResult(payload, asJson);
  }
} catch (error) {
  failInput(error, asJson);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readTemplate(name) {
  return readFile(new URL(`../assets/templates/${name}`, import.meta.url), "utf8");
}

async function ensureGitignore(target) {
  const ignorePath = path.join(target, ".gitignore");
  const start = "# roomfile-private-start";
  const block = `${start}\n# Personal room photos, measurements, budgets, and provider state.\nroomfile/\n# roomfile-private-end\n`;
  let current = "";
  try {
    current = await readFile(ignorePath, "utf8");
  } catch {
    // A new consumer project may not have a .gitignore yet.
  }
  if (current.includes(start)) return;
  const prefix = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
  await appendFile(ignorePath, `${prefix}${block}`);
}
