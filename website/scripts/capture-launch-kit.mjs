import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.ROOMFILE_PREVIEW_URL ?? "http://localhost:49348";
const root = resolve(import.meta.dirname, "../..");

const manifest = JSON.parse(
  await readFile(resolve(root, "launch/manifest.json"), "utf8"),
);

await Promise.all([
  mkdir(resolve(root, "launch/before-after"), { recursive: true }),
  mkdir(resolve(root, "launch/workflow"), { recursive: true }),
]);

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });

for (const asset of manifest.assets) {
  await page.goto(`${baseUrl}${asset.route}`, { waitUntil: "networkidle" });
  const canvas = page.locator("main.launch-canvas");
  const box = await canvas.boundingBox();
  if (!box || box.width !== asset.width || box.height !== asset.height) {
    throw new Error(
      `${asset.file} canvas is ${box?.width} × ${box?.height}; expected ${asset.width} × ${asset.height}.`,
    );
  }
  const text = await canvas.innerText();
  for (const required of asset.visible_text) {
    if (!text.toLocaleLowerCase().includes(required.toLocaleLowerCase())) {
      throw new Error(`${asset.file} is missing visible text: ${required}`);
    }
  }
  const clipped = await canvas.evaluate((element) => {
    const canvasRect = element.getBoundingClientRect();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const failures = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      const rect = range.getBoundingClientRect();
      if (
        rect.width > 0
        && (
          rect.left < canvasRect.left - 0.5
          || rect.right > canvasRect.right + 0.5
          || rect.top < canvasRect.top - 0.5
          || rect.bottom > canvasRect.bottom + 0.5
        )
      ) failures.push(walker.currentNode.textContent.trim());
    }
    return failures;
  });
  if (clipped.length) throw new Error(`${asset.file} clips text: ${clipped.join(" | ")}`);
  await canvas.screenshot({ path: resolve(root, "launch", asset.file) });
  process.stdout.write(`launch/${asset.file}\n`);
}

await browser.close();
