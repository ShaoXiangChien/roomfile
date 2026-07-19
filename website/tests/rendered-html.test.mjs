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
  ["/styles", "Roomfile Style Atlas"],
  ["/styles/mid-century-modern", "Mid-century Modern"],
  ["/styles/bauhaus", "Bauhaus"],
  ["/styles/japandi", "Japandi"],
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
  assert.match(html, /The research behind the conversation/);
  assert.match(html, /reactions remain the source of truth/i);
  assert.match(html, /01/);
  assert.match(html, /06/);
  assert.doesNotMatch(html, /Three answers to the same room/i);
  assert.doesNotMatch(html, /Eclectic/i);
  assert.doesNotMatch(html, /Open source, honest limits/i);
  assert.doesNotMatch(html, /Roomfile follows your project’s region/i);
  assert.doesNotMatch(html, /This example uses IKEA US and Amazon US/i);
  assert.doesNotMatch(html, /A project folder, not another account/i);
  assert.doesNotMatch(html, /A command for every decision/i);
  assert.doesNotMatch(html, /Choose a style|Style picker|Supported styles/i);
});

test("Style Atlas routes render sourced field guides rather than presets", async () => {
  const index = await (await render("/styles")).text();
  assert.match(index, /Roomfile Style Atlas/);
  assert.match(index, /first field guides/i);
  assert.match(index, /better design conversations/i);
  assert.doesNotMatch(index, /style picker|supported styles|choose a style/i);

  const guides = [
    ["/styles/mid-century-modern", "/styles/mid-century-modern"],
    ["/styles/bauhaus", "/styles/bauhaus"],
    ["/styles/japandi", "/styles/japandi"],
  ];
  for (const [pathname, canonical] of guides) {
    const html = await (await render(pathname)).text();
    assert.match(html, new RegExp(`rel="canonical" href="https:\\/\\/[^"]+${canonical}"`));
    assert.match(html, /Historical core/);
    assert.match(html, /Current expressions/);
    assert.match(html, /What to notice/);
    assert.match(html, /Do not generalize/);
    assert.match(html, /Room translation/);
    assert.match(html, /Questions for the room/);
    assert.match(html, /Sources/);
    assert.match(html, /CC-BY-4\.0|CC0-1\.0|PDM-1\.0/);
    assert.match(html, /width="\d+"/);
    assert.match(html, /height="\d+"/);
  }

  const japandi = await (await render("/styles/japandi")).text();
  assert.match(japandi, /contemporary|late-2010s\/2020s/i);
  assert.match(japandi, /not an ancient|not a historical/i);
  const bauhaus = await (await render("/styles/bauhaus")).text();
  assert.match(bauhaus, /workshop|pedagogy/i);
  assert.doesNotMatch(bauhaus, /Bauhaus is primary colors/i);
});

test("every synchronized Atlas visual and source is published with attribution", async () => {
  const atlas = JSON.parse(
    await readFile(new URL("../app/generated/style-atlas.json", import.meta.url), "utf8"),
  );

  for (const pack of atlas.packs) {
    const html = await (await render(`/styles/${pack.id}`)).text();
    for (const visual of pack.visuals) {
      assert.match(html, new RegExp(visual.id));
      for (const value of [
        visual.creator,
        visual.institution,
        visual.license,
        visual.source_page,
      ]) {
        assert.equal(html.includes(value.replaceAll("&", "&amp;")), true, `${pack.id}/${visual.id}: ${value}`);
      }
    }
    for (const source of pack.sources) {
      assert.equal(html.includes(source.id), true, `${pack.id}/${source.id}`);
      assert.equal(html.includes(source.url.replaceAll("&", "&amp;")), true, `${pack.id}/${source.id} URL`);
    }
  }
});

test("case studies and field guides cross-link without conflating research and application", async () => {
  const relationships = [
    ["/examples/apartment", "/styles/mid-century-modern"],
    ["/examples/bauhaus-workspace", "/styles/bauhaus"],
    ["/examples/japandi-bedroom", "/styles/japandi"],
  ];
  for (const [example, guide] of relationships) {
    const exampleHtml = await (await render(example)).text();
    const guideHtml = await (await render(guide)).text();
    assert.match(exampleHtml, new RegExp(`href="${guide}"`));
    assert.match(guideHtml, new RegExp(`href="${example}"`));
  }
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
  assert.match(sitemap, /\/styles\/mid-century-modern/);
  assert.match(sitemap, /\/styles\/bauhaus/);
  assert.match(sitemap, /\/styles\/japandi/);
  assert.doesNotMatch(sitemap, /\/examples\/us-apartment/);

  await Promise.all([
    access(new URL("../app/robots.ts", import.meta.url)),
    access(new URL("../app/sitemap.ts", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
