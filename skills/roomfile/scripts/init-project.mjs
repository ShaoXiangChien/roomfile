#!/usr/bin/env node
import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SCHEMA_VERSION,
  emptyStyleContext,
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
  const profile = args.profile
    ? normalizeProfile(JSON.parse(await readFile(path.resolve(String(args.profile)), "utf8")))
    : null;

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
    const rooms = profile?.rooms ?? [
      { id: "living-room", name: "Living room", status: "capture-needed" },
    ];
    const roomDirectories = rooms.map((entry) =>
      path.join(project, "rooms", entry.id),
    );
    const paths = [
      project,
      path.join(project, "inspiration", "screenshots"),
      path.join(project, ".runtime"),
      ...roomDirectories.flatMap((room) => [
        path.join(room, "assets", "source"),
        path.join(room, "assets", "generated"),
        path.join(room, "concepts"),
      ]),
    ];
    await Promise.all(paths.map((directory) => mkdir(directory, { recursive: true })));

    const files = new Map([
      [
        manifestPath,
        {
          schema_version: SCHEMA_VERSION,
          setup_status: profile ? "ready" : "needs-profile",
          project_name: profile?.project_name ?? "My home",
          country: profile?.country ?? "",
          region: profile?.region ?? "",
          postal_code: profile?.postal_code ?? "",
          currency: profile?.currency ?? "",
          measurement_unit: profile?.measurement_unit ?? null,
          budget: profile?.budget ?? { amount: null, currency: "" },
          privacy_mode: privacy,
          preferred_retailers: profile?.preferred_retailers ?? [],
          ...(profile
            ? { retailer_strategy: profile.retailer_strategy }
            : {}),
          rendering: {
            preferred_adapter: "banana",
            external_processing_consent: "ask-per-provider",
          },
          rooms,
        },
      ],
      [
        path.join(project, "inspiration", "index.json"),
        { schema_version: SCHEMA_VERSION, sources: [] },
      ],
      [
        path.join(project, "inspiration", "style-context.json"),
        emptyStyleContext(),
      ],
      [
        path.join(project, ".runtime", "render-sessions.json"),
        { schema_version: SCHEMA_VERSION, providers: {} },
      ],
    ]);
    for (const [index, room] of roomDirectories.entries()) {
      const roomProfile = rooms[index];
      files.set(path.join(room, "geometry.json"), {
        schema_version: SCHEMA_VERSION,
        unit: profile?.measurement_unit ?? null,
        boundary: {
          type: "polygon",
          points: [],
        },
        openings: [],
        fixed_elements: [],
        clearance_zones: [],
      });
      files.set(path.join(room, "facts.json"), {
        schema_version: SCHEMA_VERSION,
        facts: [],
      });
      files.set(path.join(room, "products.json"), {
        schema_version: SCHEMA_VERSION,
        products: [],
      });
      roomProfile.status ??= "capture-needed";
    }

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
    ]);
    for (const [index, room] of roomDirectories.entries()) {
      markdown.set(
        path.join(room, "ROOM.md"),
        roomTemplate.replaceAll("{{ROOM_NAME}}", rooms[index].name),
      );
      markdown.set(path.join(room, "DECISIONS.md"), decisionsTemplate);
      markdown.set(path.join(room, "SHOPPING.md"), shoppingTemplate);
      markdown.set(path.join(room, "EXECUTION.md"), executionTemplate);
    }

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
    const warnings = profile
      ? []
      : [
          "Shopping profile is incomplete; collect location, currency, units, and retailer strategy before sourcing.",
        ];
    const payload = result("success", [], warnings, artifacts);
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

function normalizeProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("--profile must contain a JSON object");
  }
  for (const field of [
    "project_name",
    "country",
    "currency",
    "measurement_unit",
    "budget",
    "preferred_retailers",
    "retailer_strategy",
    "rooms",
  ]) {
    if (value[field] === undefined || value[field] === null) {
      throw new Error(`--profile is missing ${field}`);
    }
  }
  if (!/^[A-Z]{3}$/.test(value.currency)) {
    throw new Error("--profile currency must be a three-letter ISO code");
  }
  if (!["in", "cm"].includes(value.measurement_unit)) {
    throw new Error("--profile measurement_unit must be in or cm");
  }
  if (!["user-preferred", "agent-suggested"].includes(value.retailer_strategy)) {
    throw new Error(
      "--profile retailer_strategy must be user-preferred or agent-suggested",
    );
  }
  if (
    !value.budget ||
    !Number.isFinite(value.budget.amount) ||
    value.budget.currency !== value.currency
  ) {
    throw new Error("--profile budget must use the project currency");
  }
  if (!Array.isArray(value.preferred_retailers)) {
    throw new Error("--profile preferred_retailers must be an array");
  }
  if (!Array.isArray(value.rooms) || value.rooms.length === 0) {
    throw new Error("--profile rooms must contain at least one room");
  }
  const rooms = value.rooms.map((room) => {
    if (!room?.id || !room?.name || !/^[a-z0-9-]+$/.test(room.id)) {
      throw new Error(
        "--profile room ids must use lowercase letters, numbers, and hyphens",
      );
    }
    return {
      id: room.id,
      name: room.name,
      status: room.status ?? "capture-needed",
    };
  });
  return {
    project_name: value.project_name,
    country: value.country,
    region: value.region ?? "",
    postal_code: value.postal_code ?? "",
    currency: value.currency,
    measurement_unit: value.measurement_unit,
    budget: value.budget,
    preferred_retailers: value.preferred_retailers,
    retailer_strategy: value.retailer_strategy,
    rooms,
  };
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
