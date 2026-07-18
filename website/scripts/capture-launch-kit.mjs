import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.ROOMFILE_PREVIEW_URL ?? "http://localhost:49348";
const root = resolve(import.meta.dirname, "../..");

const assets = [
  ["launch/og-card.png", "/launch-kit?format=og"],
  ["launch/repository-preview.png", "/launch-kit?format=repository"],
  ["launch/readme-hero.png", "/launch-kit?format=readme"],
  ...Array.from({ length: 5 }, (_, index) => [
    `launch/before-after/0${index + 1}.png`,
    `/launch-kit?deck=journey&slide=${index + 1}`,
  ]),
  ...Array.from({ length: 5 }, (_, index) => [
    `launch/workflow/0${index + 1}.png`,
    `/launch-kit?deck=workflow&slide=${index + 1}`,
  ]),
];

await Promise.all([
  mkdir(resolve(root, "launch/before-after"), { recursive: true }),
  mkdir(resolve(root, "launch/workflow"), { recursive: true }),
]);

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });

for (const [output, pathname] of assets) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  const canvas = page.locator("main.launch-canvas");
  await canvas.screenshot({ path: resolve(root, output) });
  process.stdout.write(`${output}\n`);
}

await browser.close();
