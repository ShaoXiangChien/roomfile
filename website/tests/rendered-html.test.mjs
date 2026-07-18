import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname.replaceAll("/", "-")}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://roomfile.dev${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

const routes = [
  ["/", "Design your home, together."],
  ["/docs/getting-started", "Getting started"],
  ["/docs/commands", "Command reference"],
  ["/docs/project-files", "Project files"],
  ["/docs/rendering", "Rendering"],
  ["/docs/sourcing", "Sourcing"],
  ["/examples", "Selected Homes"],
  ["/examples/apartment", "A living room that became more itself"],
  ["/examples/bauhaus-workspace", "A small workspace with more energy"],
  ["/examples/japandi-bedroom", "A calmer place to sleep"],
  ["/examples/us-apartment", "A living room that became more itself"],
  ["/docs/contributing", "Contributing"],
];

test("server-renders every public route with shared navigation", async () => {
  for (const [pathname, heading] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /Roomfile/);
    assert.match(html, /Docs/);
    assert.match(html, /GitHub/);
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  }
});

test("homepage states the real product contract", async () => {
  const response = await render("/");
  const html = await response.text();

  assert.match(html, /npx skills add ShaoXiangChien\/roomfile/);
  assert.match(html, /understand the space you have/i);
  assert.match(html, /Find what feels like you/);
  assert.match(html, /Design it together/);
  assert.match(html, /Try the real thing/);
  assert.match(html, /Make it real/);
  assert.match(html, /More rooms in progress/);
  assert.match(html, /Mid-century Modern/);
  assert.match(html, /Bauhaus/);
  assert.match(html, /Japandi/);
  assert.match(html, /IKEA/);
  assert.match(html, /Amazon/);
  assert.match(html, /Product ledger/);
  assert.match(html, /01/);
  assert.match(html, /06/);
  assert.doesNotMatch(html, /Three answers to the same room/i);
  assert.doesNotMatch(html, /Eclectic/i);
  assert.doesNotMatch(html, /Open source, honest limits/i);
  assert.doesNotMatch(html, /Roomfile follows your project’s region/i);
  assert.doesNotMatch(html, /This example uses IKEA US and Amazon US/i);
  assert.doesNotMatch(html, /A project folder, not another account/i);
  assert.doesNotMatch(html, /A command for every decision/i);
});

test("legacy apartment route is canonicalized and excluded from indexing", async () => {
  const response = await render("/examples/us-apartment");
  const html = await response.text();

  assert.match(
    html,
    /rel="canonical" href="https:\/\/[^"]+\/examples\/apartment"/,
  );
  assert.match(html, /name="robots" content="noindex, follow"/);
});

test("docs preserve privacy, sourcing, safety, and command contracts", async () => {
  const pages = await Promise.all(
    routes.slice(1).map(async ([pathname]) => (await (await render(pathname)).text())),
  );
  const html = pages.join("\n");
  const commands = [
    "init",
    "status",
    "taste",
    "capture",
    "brief",
    "explore",
    "refine",
    "place",
    "source",
    "plan",
    "audit",
  ];

  for (const command of commands) {
    assert.match(html, new RegExp(`\\$roomfile ${command}\\b`));
  }
  assert.match(html, /private and gitignored/i);
  assert.match(html, /ASIN/);
  assert.match(html, /article number/i);
  assert.match(html, /never purchases/i);
  assert.match(html, /retrieval date/i);
  assert.match(html, /Apache-2\.0/);
});

test("ships launch metadata and crawl files without starter residue", async () => {
  const [layout, sitemap, packageJson, hosting] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /metadataBase/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /twitter/);
  assert.match(layout, /Roomfile/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|Geist/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(hosting, /"d1": null/);
  assert.match(hosting, /"r2": null/);
  assert.match(sitemap, /\/examples\/apartment/);
  assert.match(sitemap, /\/examples\/bauhaus-workspace/);
  assert.match(sitemap, /\/examples\/japandi-bedroom/);
  assert.doesNotMatch(sitemap, /\/examples\/us-apartment/);

  await Promise.all([
    access(new URL("../app/robots.ts", import.meta.url)),
    access(new URL("../app/sitemap.ts", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
