#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(".");
const temp = await mkdtemp(path.join(os.tmpdir(), "roomfile-smoke-"));

try {
  const neutralTarget = path.join(temp, "neutral");
  run(process.execPath, [
    path.join(root, "skills/roomfile/scripts/init-project.mjs"),
    "--target",
    neutralTarget,
    "--privacy",
    "private",
    "--json",
  ]);

  const neutralManifest = JSON.parse(
    await readFile(
      path.join(neutralTarget, "roomfile/roomfile.json"),
      "utf8",
    ),
  );
  const neutralStyleContext = JSON.parse(
    await readFile(
      path.join(neutralTarget, "roomfile/inspiration/style-context.json"),
      "utf8",
    ),
  );
  if (
    neutralManifest.setup_status !== "needs-profile" ||
    neutralManifest.country !== "" ||
    neutralManifest.currency !== "" ||
    neutralManifest.measurement_unit !== null ||
    neutralManifest.preferred_retailers.length !== 0
  ) {
    throw new Error("neutral scaffold invented shopping-profile defaults");
  }
  if (
    neutralStyleContext.schema_version !== "0.3.0" ||
    Object.values(neutralStyleContext).some(
      (value) => Array.isArray(value) && value.length !== 0,
    )
  ) {
    throw new Error("neutral scaffold did not create an empty v0.3 style context");
  }

  const neutralValidation = run(
    process.execPath,
    [
      path.join(root, "skills/roomfile/scripts/validate-project.mjs"),
      "--project",
      path.join(neutralTarget, "roomfile"),
      "--json",
    ],
    1,
  );
  if (!neutralValidation.stdout.includes("shopping_profile_incomplete")) {
    throw new Error("neutral scaffold did not request its missing profile");
  }

  const profileTarget = path.join(temp, "profiled");
  const profilePath = path.join(temp, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify(
      {
        project_name: "Fresh smoke home",
        country: "CA",
        region: "ON",
        postal_code: "M5V",
        currency: "CAD",
        measurement_unit: "cm",
        budget: { amount: 2500, currency: "CAD" },
        preferred_retailers: ["EQ3", "IKEA Canada"],
        retailer_strategy: "user-preferred",
        rooms: [{ id: "living-room", name: "Living room" }],
      },
      null,
      2,
    ),
  );

  run(process.execPath, [
    path.join(root, "skills/roomfile/scripts/init-project.mjs"),
    "--target",
    profileTarget,
    "--privacy",
    "private",
    "--profile",
    profilePath,
    "--json",
  ]);
  run(process.execPath, [
    path.join(root, "skills/roomfile/scripts/validate-project.mjs"),
    "--project",
    path.join(profileTarget, "roomfile"),
    "--json",
  ]);

  const manifest = JSON.parse(
    await readFile(path.join(profileTarget, "roomfile/roomfile.json"), "utf8"),
  );
  const profiledStyleContext = JSON.parse(
    await readFile(
      path.join(profileTarget, "roomfile/inspiration/style-context.json"),
      "utf8",
    ),
  );
  if (
    manifest.setup_status !== "ready" ||
    manifest.country !== "CA" ||
    manifest.currency !== "CAD" ||
    manifest.measurement_unit !== "cm" ||
    manifest.retailer_strategy !== "user-preferred"
  ) {
    throw new Error("profiled fresh project lost preference-first settings");
  }
  if (profiledStyleContext.reference_images.length !== 0) {
    throw new Error("profiled scaffold did not start with an empty style context");
  }

  const ignore = await readFile(path.join(profileTarget, ".gitignore"), "utf8");
  if (!ignore.includes("# roomfile-private-start") || !ignore.includes("roomfile/")) {
    throw new Error("private project was not gitignored");
  }

  console.log(
    "Fresh neutral scaffold and preference-first initialization passed.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}

function run(command, args, expectedStatus = 0) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== expectedStatus) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result;
}
