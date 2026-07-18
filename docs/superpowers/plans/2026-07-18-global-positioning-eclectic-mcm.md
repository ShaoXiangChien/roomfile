# Roomfile Global Positioning and Eclectic Mid-century Modern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Roomfile v0.1.1 with globally applicable, style-agnostic positioning and an Eclectic Mid-century Modern example derived from the approved inspiration evidence.

**Architecture:** Preserve the portable umbrella skill, versioned project format, deterministic fit boundary, and existing editorial website. Correct positioning through contract tests and focused copy changes, treat the existing US fixture as one configured example, then regenerate only the three dependent Mid-century images through the provider-neutral render contract and Banana.

**Tech Stack:** Markdown Agent Skill, dependency-free Node.js 20+ scripts and tests, JSON project files, React/TypeScript Vinext website, Banana with Gemini image models, Sites hosting, GitHub Actions.

## Global Constraints

- Roomfile must present itself as usable for any room, region, retailer mix, or style direction.
- Mid-century Modern, Bauhaus, and Japandi are example directions, not a fixed style catalog.
- One `explore` round returns three deliberately different directions by default; users may request other styles or more rounds.
- Public case-study language uses “fictional apartment” or “apartment example.”
- `/examples/apartment` is canonical; `/examples/us-apartment` remains functional.
- The selected direction is labeled “Eclectic Mid-century Modern.”
- The user's inspiration image remains private and is not committed or deployed.
- Canonical architecture, camera, existing sofa, dining table, openings, fixed elements, and landlord-protected surfaces remain locked.
- New major furniture may not appear without structured geometry and deterministic fit evidence.
- Bauhaus, Japandi, and source-room images remain unchanged.
- Every render remains a visual approximation; only structured measurements may prove fit.
- The release target is v0.1.1.

---

### Task 1: Lock the global and style-agnostic product contract

**Files:**
- Modify: `tests/repository-contract.test.mjs`
- Modify: `tests/skill-contract.test.mjs`
- Modify: `tests/demo-project.test.mjs`
- Modify: `README.md`
- Modify: `skills/roomfile/SKILL.md`
- Modify: `skills/roomfile/references/workflows.md`
- Modify: `skills/roomfile/references/sourcing.md`
- Modify: `examples/us-apartment/roomfile/HOME.md`
- Modify: `examples/us-apartment/roomfile/STYLE.md`
- Modify: `examples/us-apartment/roomfile/inspiration/analysis.md`

**Interfaces:**
- Consumes: existing `$roomfile` command contract and public US fixture.
- Produces: copy and tests that distinguish configurable product behavior from example configuration.

- [ ] **Step 1: Write failing contract tests**

Add assertions equivalent to:

```js
assert.match(readme, /any room.*any style/is);
assert.match(readme, /examples, not presets/i);
assert.match(readme, /Eclectic Mid-century Modern/);
assert.doesNotMatch(readme, /serves US apartment renters/i);

assert.match(skill, /project-configured region/i);
assert.match(skill, /style evidence.*no style allowlist/is);
assert.doesNotMatch(skill, /Initialize a private US apartment project/);

const concept = JSON.parse(
  await readFile(
    path.join(
      demo,
      "rooms/living-room/concepts/mid-century-modern/concept.json",
    ),
    "utf8",
  ),
);
assert.equal(concept.style_direction, "Eclectic Mid-century Modern");
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/repository-contract.test.mjs tests/skill-contract.test.mjs tests/demo-project.test.mjs
```

Expected: failures for missing global positioning, missing “examples, not presets,” the old US-only command description, and the old concept label.

- [ ] **Step 3: Update skill and public repository copy**

Use these exact positioning lines:

```markdown
Roomfile works with any room and any style. Region, currency, units, retailers,
and local constraints are project settings.
```

```markdown
The three directions below are examples, not presets. Roomfile derives each
exploration from your own inspiration evidence and can explore other styles or
additional rounds.
```

Change `init` in the command table to:

```markdown
| `init` | Initialize a private room project and collect region, units, budget, retailers, constraints, and rendering preferences. |
```

State in `references/workflows.md` that `explore` returns three directions by
default for comparison, accepts arbitrary style strings, and has no style
allowlist.

State in `references/sourcing.md` that IKEA US and Amazon US are the default
priority only when a project selects the United States; other projects use
configured local retailers and dated regional evidence.

- [ ] **Step 4: Update example taste evidence**

In `STYLE.md` and `inspiration/analysis.md`, record the approved evidence:
warm amber lighting; walnut and dark wood; olive, rust, burnt orange, tobacco
brown, cream, and black; mushroom and arched lamps; tactile upholstery; graphic
1970s rug; records, books, posters, plants, and collected personal objects.

Explicitly state that the reference suggests layered abundance without blocked
circulation, and that it is not evidence for generic beige minimalism.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/repository-contract.test.mjs tests/skill-contract.test.mjs tests/demo-project.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit**

```bash
git add README.md skills/roomfile tests examples/us-apartment/roomfile/HOME.md examples/us-apartment/roomfile/STYLE.md examples/us-apartment/roomfile/inspiration/analysis.md
git commit -m "feat: make Roomfile positioning global and style agnostic"
```

---

### Task 2: Update the Eclectic Mid-century Modern project contract

**Files:**
- Modify: `examples/us-apartment/roomfile/rooms/living-room/COMPARISON.md`
- Modify: `examples/us-apartment/roomfile/rooms/living-room/DECISIONS.md`
- Modify: `examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/concept.json`
- Modify: `examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/render-request-v1.json`
- Modify: `examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/render-request.json`
- Modify: `examples/us-apartment/roomfile/rooms/living-room/concepts/product-placement-test/concept.json`
- Modify: `examples/us-apartment/roomfile/rooms/living-room/concepts/product-placement-test/render-request.json`
- Regenerate: corresponding `render-request*.md` files with `build-render-brief.mjs`
- Modify: `tests/render-brief.test.mjs`
- Modify: `tests/demo-project.test.mjs`

**Interfaces:**
- Consumes: locked facts in `facts.json`, canonical source image, existing render-request schema.
- Produces: three ordered render contracts—exploration, refinement, and product placement.

- [ ] **Step 1: Write failing concept-evidence tests**

Assert that both Mid-century render requests contain:

```js
assert.match(request.goal, /Eclectic Mid-century Modern/);
assert.match(request.style_evidence.join(" "), /amber/i);
assert.match(request.style_evidence.join(" "), /1970s/i);
assert.match(request.style_evidence.join(" "), /collected/i);
assert.match(request.allowed_edits.join(" "), /lighting/i);
assert.match(request.allowed_edits.join(" "), /textiles/i);
assert.match(request.allowed_edits.join(" "), /art/i);
```

Assert the locked facts still include both windows, radiator, flooring, sofa,
dining table, and camera viewpoint.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test tests/demo-project.test.mjs tests/render-brief.test.mjs
```

Expected: failures because the old requests describe sparse warm MCM and do not
carry the approved evidence.

- [ ] **Step 3: Revise concept and render contracts**

Set `style_direction` to `Eclectic Mid-century Modern` and update the goal to:

```text
Translate the approved warm, collected, 1970s-inflected Eclectic
Mid-century Modern evidence into the exact same fictional apartment while
preserving every locked architectural and inventory fact.
```

Use style evidence for amber pools of light, walnut/dark wood, olive/rust/burnt
orange/tobacco/cream/black palette, mushroom and arched lamps, tactile textiles,
graphic rug, records, books, posters, plants, and intentional collection
layering.

Allowed edits cover reversible lighting, textiles, wall art using removable
methods, plants, books/records, accessories, and appropriately scaled storage.
They do not authorize replacing the sofa/table or adding unmeasured major
furniture.

- [ ] **Step 4: Regenerate provider briefs**

Run:

```bash
node skills/roomfile/scripts/build-render-brief.mjs \
  --request examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/render-request-v1.json \
  --output examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/render-request-v1.md
node skills/roomfile/scripts/build-render-brief.mjs \
  --request examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/render-request.json \
  --output examples/us-apartment/roomfile/rooms/living-room/concepts/mid-century-modern/render-request.md
node skills/roomfile/scripts/build-render-brief.mjs \
  --request examples/us-apartment/roomfile/rooms/living-room/concepts/product-placement-test/render-request.json \
  --output examples/us-apartment/roomfile/rooms/living-room/concepts/product-placement-test/render-request.md
```

Expected: three successful artifact results with no rendered-text instruction.

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
node --test tests/demo-project.test.mjs tests/render-brief.test.mjs
npm run validate:example
```

Expected: all tests and validation pass.

- [ ] **Step 6: Commit**

```bash
git add examples/us-apartment/roomfile/rooms/living-room tests
git commit -m "feat: define the eclectic mid-century demo direction"
```

---

### Task 3: Make the website example generic and style-flexible

**Files:**
- Modify: `website/tests/rendered-html.test.mjs`
- Create: `website/app/examples/apartment/page.tsx`
- Modify: `website/app/examples/us-apartment/page.tsx`
- Modify: `website/app/components/site-chrome.tsx`
- Modify: `website/app/components/room-visual.tsx`
- Modify: `website/app/page.tsx`
- Modify: `website/app/layout.tsx`
- Modify: `website/app/sitemap.ts`
- Modify: `website/app/docs/getting-started/page.tsx`
- Modify: `website/app/docs/commands/page.tsx`
- Modify: `website/app/docs/sourcing/page.tsx`
- Modify: `website/README.md`

**Interfaces:**
- Consumes: existing case-study component structure and `RoomVisual`.
- Produces: canonical generic example route and a compatibility route with matching content.

- [ ] **Step 1: Write failing rendered-route tests**

Update the route table and assertions:

```js
[ "/examples/apartment", "A fictional apartment" ],
[ "/examples/us-apartment", "A fictional apartment" ],
```

Add:

```js
assert.match(html, /any room/i);
assert.match(html, /examples, not presets/i);
assert.match(html, /Eclectic Mid-century Modern/);
assert.doesNotMatch(html, /serves US apartment renters/i);
```

Read `sitemap.ts` and assert it contains `/examples/apartment` but does not
publish `/examples/us-apartment` as a canonical sitemap URL.

- [ ] **Step 2: Run website test and verify RED**

Run:

```bash
npm --prefix website test
```

Expected: build succeeds but route/copy assertions fail.

- [ ] **Step 3: Extract the canonical case-study page**

Move the full case-study implementation to
`website/app/examples/apartment/page.tsx`. Export the same component from the
compatibility file:

```tsx
export { metadata, default } from "../apartment/page";
```

Use metadata:

```ts
export const metadata: Metadata = {
  title: "Fictional apartment example",
  description:
    "A complete Roomfile workflow for a fictional apartment with configurable regional sourcing.",
  alternates: { canonical: "/examples/apartment" },
};
```

- [ ] **Step 4: Update visible product and example copy**

Change navigation links to `/examples/apartment` and labels to “Apartment
example.” Keep the actual USD, fictional ZIP, IKEA US, and Amazon US facts inside
the sourcing section.

Label the selected card “Eclectic Mid-century Modern” and describe it as:

```text
Amber light, walnut, olive, rust, tactile layers, and collected objects.
```

Add near the comparison:

```text
These are examples, not presets. Roomfile derives directions from each
person's references and can explore other styles or additional rounds.
```

- [ ] **Step 5: Update sitemap, metadata, and alt text**

Publish `/examples/apartment` in the sitemap. Use generic apartment wording in
global Open Graph alt text and `RoomVisual` alt text. Keep absolute production
metadata URLs unchanged.

- [ ] **Step 6: Run website tests, lint, and build**

Run:

```bash
npm --prefix website test
npm --prefix website run lint
npm --prefix website run build
```

Expected: all rendered-route tests pass, lint exits 0, and both example routes
build.

- [ ] **Step 7: Commit**

```bash
git add website
git commit -m "feat: present a generic style-flexible apartment example"
```

---

### Task 4: Regenerate the three Banana images

**Files:**
- Preserve until success: existing three generated PNGs.
- Replace on success: `examples/us-apartment/roomfile/rooms/living-room/assets/generated/mid-century-modern.png`
- Replace on success: `examples/us-apartment/roomfile/rooms/living-room/assets/generated/mid-century-modern-refined.png`
- Replace on success: `examples/us-apartment/roomfile/rooms/living-room/assets/generated/ikea-stockholm-placement.png`
- Modify: `examples/us-apartment/roomfile/.runtime/render-cost-estimate.json`
- Modify: `examples/us-apartment/roomfile/.runtime/render-sessions.json`

**Interfaces:**
- Consumes: private inspiration image, canonical source-room image, ordered render requests.
- Produces: three 4:3, 2K visual approximations with continuity and no rendered labels.

- [ ] **Step 1: Read Banana generation references**

Read `references/gemini-models.md` and `references/prompt-engineering.md`
completely before constructing prompts. Inspect the current Banana tool schema
and select the documented model, size, ratio, and direct fallback only if the
MCP worker still holds stale credentials.

- [ ] **Step 2: Estimate and log cost**

Estimate three 2K outputs before generation and write the estimate with model,
count, per-image estimate, total estimate, timestamp, and purpose. Do not expose
or commit API credentials.

- [ ] **Step 3: Generate exploration into temporary output**

Use the canonical source room and private inspiration image as separate inputs.
The prompt must preserve locked room truth, translate style signals rather than
copy architecture, contain no caption or graphic text, and avoid unmeasured
major furniture.

Verify the output exists, is a valid image, is 4:3, and visibly preserves both
windows, radiator, floor, sofa, dining table, openings, and camera.

- [ ] **Step 4: Generate refinement and placement in sequence**

Use the exploration image as continuity input for refinement. Use the refined
image and IKEA product reference/evidence for the placement test. Do not start a
later generation from the old published image.

- [ ] **Step 5: Inspect all outputs before replacement**

Reject and retry an output if it changes architecture, removes locked
inventory, inserts major unmeasured furniture, renders text/captions, or misses
the approved warm collected evidence.

After all three pass, atomically replace the tracked PNGs and log actual model,
resolution, adapter, status, interaction/source chain, and output cost.

- [ ] **Step 6: Commit**

```bash
git add examples/us-apartment/roomfile
git commit -m "feat: regenerate the eclectic mid-century visual sequence"
```

---

### Task 5: Refresh website imagery and social launch assets

**Files:**
- Replace: `website/public/examples/us-apartment/mid-century-modern.png`
- Replace: `website/public/examples/us-apartment/mid-century-modern-refined.png`
- Replace: `website/public/examples/us-apartment/ikea-stockholm-placement.png`
- Modify: `website/app/launch-kit/page.tsx`
- Replace: `website/public/og.png`
- Replace: `launch/og-card.png`
- Replace: `launch/readme-hero.png`
- Replace: `launch/repository-preview.png`
- Replace: `launch/before-after/01.png` through `05.png`
- Replace: `launch/workflow/01.png` through `05.png`
- Modify: `launch/COPY.md`
- Modify: `launch/ALT-TEXT.md`

**Interfaces:**
- Consumes: approved three-image sequence and existing `/launch-kit` renderer.
- Produces: launch images with correct dimensions and editable platform copy.

- [ ] **Step 1: Copy approved images to website public assets**

Copy the three approved PNGs byte-for-byte and verify checksums match their
example sources.

- [ ] **Step 2: Update launch-kit copy**

Use “Eclectic Mid-century Modern,” “apartment example,” and “examples, not
presets.” Remove primary “US rental” positioning while retaining concrete US
sourcing facts where the example explains retailer evidence.

- [ ] **Step 3: Build and render launch assets**

Start the existing website development server, render the OG, README,
repository, before/after, and workflow launch-kit states at their established
viewports, then save the output files at the existing paths.

Required dimensions:

```text
OG card: 1200×630
README hero: 1600×900
Repository preview: 1280×640
Carousel slides: 1080×1350
```

- [ ] **Step 4: Inspect representative outputs**

Visually inspect the OG card, README hero, one comparison slide, and one
workflow slide for correct imagery, readable copy, no cropped footer, no old
MCM image, and no “US-only” implication.

- [ ] **Step 5: Update editable copy and alt text**

Keep X, LinkedIn, Reddit, and Hacker News sections. Describe the example as one
configured fictional apartment and the style cards as examples.

- [ ] **Step 6: Commit**

```bash
git add website launch README.md
git commit -m "feat: refresh launch assets for eclectic mid-century"
```

---

### Task 6: Validate the complete v0.1.1 source

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `website/package.json`
- Modify: `website/package-lock.json`
- Modify: `website/app/components/site-chrome.tsx`
- Modify only if required by validation: affected tests or copy.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: one committed, release-ready source state.

- [ ] **Step 1: Bump versions**

Set root and website package versions and the visible website version label to
`0.1.1`. Do not change schema version `0.1.0`; this release is backward
compatible.

- [ ] **Step 2: Run the full local release gate**

Run:

```bash
npm test
npm run test:skill
npm run validate:example
npm run smoke:fresh
npm run check:privacy
npm --prefix website test
npm --prefix website run lint
npm --prefix website run build
npm --prefix website audit --omit=dev
git diff --check
```

Expected: zero test failures, a valid skill and demo, clean privacy scan, clean
lint/build, zero production vulnerabilities, and no whitespace errors.

- [ ] **Step 3: Audit requirements line by line**

Run searches proving:

- primary headings/navigation no longer say “US apartment” or “US rental”;
- visible concept labels use “Eclectic Mid-century Modern”;
- “examples, not presets” exists in README and website;
- the private inspiration filename and attachment path are absent from tracked
  files;
- only the three intended generated images changed;
- schemas remain at `0.1.0`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: prepare Roomfile v0.1.1"
```

---

### Task 7: Publish the website and GitHub release

**Files:**
- Reuse: `website/.openai/hosting.json`
- No new local source files unless deployment validation exposes a defect.

**Interfaces:**
- Consumes: exact verified branch HEAD and `website/dist`.
- Produces: public Sites version, merged GitHub main, and v0.1.1 release.

- [ ] **Step 1: Complete the development branch**

Run the full verification gate again, then use the finishing-development-branch
workflow. Merge the feature branch into `main` only after explicit integration
choice, and re-run tests on the merged result.

- [ ] **Step 2: Push the verified source**

Push `main` to GitHub and wait for the Node 20/22, website build, link check,
secret scan, and fresh-install jobs to succeed.

- [ ] **Step 3: Prepare and deploy the exact website source**

Reuse the persisted Sites project ID. Push the exact website source state,
package the matching built archive with the Sites helper, save one version, and
deploy that saved version to the already-public site. Poll the deployment until
it succeeds or fails.

- [ ] **Step 4: Verify production**

Verify HTTP 200 for:

```text
/
/docs/getting-started
/docs/commands
/docs/project-files
/docs/rendering
/docs/sourcing
/docs/contributing
/examples/apartment
/examples/us-apartment
/robots.txt
/sitemap.xml
```

Verify canonical, OG, and sitemap URLs use the production origin and canonical
example route.

- [ ] **Step 5: Fresh-install and release**

Run:

```bash
npx skills add ShaoXiangChien/roomfile
```

in a clean temporary location, initialize and validate a project, clean the
temporary installation, then publish a non-draft, non-prerelease GitHub release
tagged `v0.1.1`.

- [ ] **Step 6: Final handoff**

Report the live site, repository, release, changed visual direction, image cost,
test counts, and any intentionally retained compatibility details.
