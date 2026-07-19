# Task 5 report — Style Atlas benchmark and v0.3 launch refresh

## Status

Complete. The reproducible benchmark, deterministic validator, release
documentation, launch refresh, and CI release gates are implemented. No
deployment, push, GitHub release, live research, or production Atlas/workflow
behavior change was performed.

Initial commit: `7baeded3fd2bfe9b7acf5ad22c02a92f7b9b845d`

Review-fix commit: `5d299d8ec42e27934cb337c5e08bc678535cf376`

## Scope delivered

- Added `examples/style-atlas-benchmark/` with one fictional source room,
  shared room locks, six render requests and prompts, six generated images,
  cost and provider records, and both structured and editorial human review.
- Added `scripts/validate-style-atlas-benchmark.mjs`, shared binary image
  validation, and benchmark mutation coverage.
- Added benchmark and Atlas validation commands to the repository scripts and
  CI matrix.
- Refreshed the README, contributor guidance, release notes, public release
  summary, launch copy, alt text, and all 13 social/repository raster assets for
  v0.3.0.
- Kept the launch story centered on the complete design journey, with
  “research behind the conversation” as a supporting beat rather than a style
  catalog.
- After review, bound every generation call to immutable input/reference
  hashes, rejected continuation state, added an exact 2400 × 1792 output
  contract, recaptured clipped launch assets, and separated pre-deploy internal
  route validation from post-deploy production smoke.

## TDD evidence

### RED

The following failures were observed before the corresponding implementation:

1. The initial benchmark contract test failed because the validator and
   committed benchmark directory did not exist.
2. The malformed-image fixture passed when a forged file only contained a
   JPEG signature; the test failed until structural JPEG parsing was added.
3. A mismatched estimated-cost total was not rejected; the new reconciliation
   test failed until the validator checked planned calls, per-image estimate,
   and total.
4. A cost estimate timestamp after generation was not rejected; the ordering
   test failed until preflight timing became part of validation.
5. Incorrect logged output dimensions were not rejected; the metadata test
   failed until decoded image dimensions and format were reconciled against the
   generation log.
6. The reviewer mutation changed the benchmark to chained edits, a prior
   output source, and empty guided references; validation still returned
   success. The new provenance test failed 0-versus-1 until the independent
   call state and attached references were reconciled.
7. A full DQT/DHT/SOF/SOS/EOI JPEG marker skeleton and a valid 1600 × 1200 JPEG
   both passed when the log repeated their dimensions. The mutation test failed
   until shared table/scan validation and the exact 2400 × 1792 contract were
   enforced.
8. PNG mutations with a broken IDAT CRC, and corrupt deflate data with a
   repaired CRC, both passed. The two-case test failed until PNG CRC,
   decompression, scanline-length, and filter validation was added.
9. Launch contract tests failed because no per-asset manifest/validator
   existed; repository contract tests also failed on the contradictory link
   gate and “complete local gate” release claim.

### GREEN

- `npm test`: 105/105 passed.
- `npm run test:skill`: passed.
- `npm run validate:example`: passed with the expected v0.2 upgrade warning.
- `npm run smoke:fresh`: passed.
- `npm run check:privacy`: no findings.
- `npm run validate:atlas`: passed.
- `npm run sync:styles:check`: passed.
- `npm run validate:benchmark`: passed.
- `npm run validate:launch`: all 13 assets passed.
- `npm --prefix website test`: 9/9 passed.
- `npm --prefix website run lint`: passed.
- `npm --prefix website run test:e2e`: 11 passed, 1 expected skip.
- `git diff --check`: passed.
- Root `npm ci`: completed with 0 reported vulnerabilities.
- Website tooling was upgraded to current compatible Cloudflare/Vite releases;
  `npm audit` reports 0 vulnerabilities.
- Local lychee command matching CI: 15 OK, 0 errors, 6 production-domain URLs
  excluded, 1 redirect.
- `gitleaks git --redact --verbose`: no secrets found across 39 commits,
  including the review-fix and report commits.
- Focused `gitleaks file` checks on provider metadata and new validator/test
  sources found no secrets.

## Controlled benchmark

All six runs used:

- the same fictional source room and 4:3 camera;
- the same locked architecture, windows, radiator, floor, fixed light, sofa,
  table, and circulation requirement;
- the same resident evidence within each baseline/guided pair;
- Gemini through Banana using `gemini-3.1-flash-image` (`flash`), 2K output;
- a fresh source edit rather than a continuation interaction.

The six JPEG outputs are 2400×1792. The preflight estimate was USD 0.101 per
image and USD 0.606 total. The provider did not report actual cost, so the
actual-cost field remains explicitly null rather than being invented.
Each call now records the SHA-256 of its source, request, prompt, locks, output,
and exact attached Atlas visual IDs/files. Every call sets
`fresh_source_edit: true` and `parent_interaction_id: null`; baseline attachment
arrays are empty and guided arrays contain the pack visuals actually supplied.

### Human comparison

- Mid-century Modern: the guided run produced a richer hierarchy of books,
  records, ceramics, timber, textile, metal, and glass and avoided familiar
  icon shorthand. It also added a stronger ceiling crown detail and may
  overstate storage clearance. The baseline appears to alter the fixed ceiling
  light.
- Bauhaus: the guided run made activity, adjustable light, plywood, metal
  framing, textile, work surfaces, and storage materially central instead of
  relying mainly on graphic shorthand. Its floor-to-ceiling storage may read as
  permanent and compress the sofa zone.
- Japandi: the baseline leaned heavily on familiar paper-lantern, slatted-wood,
  beige-restraint shorthand and appeared to cover the locked radiator. The
  guided run preserved the radiator, normal seating height, daily objects, and
  more varied material relationships, but its curtain still needs window and
  radiator-safety review.

The review does not claim objective superiority from one stochastic sample.
Both variants retain visible successes and failures, and every output is
labelled a visual approximation rather than dimensional proof.

## Validator coverage

The benchmark validator checks:

- exactly three baseline/guided pairs and all six outputs;
- shared PNG/JPEG validation covering JPEG tables/scans/payload thresholds and
  PNG CRC/decompression/scanlines, plus exact 2400 × 1792 output dimensions;
- common source, locks, camera, and resident evidence per pair;
- absence of Atlas-only context from baseline requests;
- exact pack ID, version, and references in guided requests;
- per-call source/request/prompt/locks/output hashes, exact reference visual
  IDs and hashes, null parent state, fresh-source route, call count, model
  settings, timestamps, preflight estimate, and cost totals;
- completed human review and all required rubric criteria;
- absence of secret-shaped values and private absolute paths in public
  metadata.

Unknown or malformed input exits with code 2; validation failures exit with
code 1; success exits with code 0.

## Launch asset inspection

All 13 refreshed raster assets were recaptured from a single manifest. Capture
fails when the canvas dimensions, required visible text, or any text-node bound
does not match. The rasters were reviewed together in a contact sheet:

- OG card;
- repository preview;
- README hero;
- five before/after slides;
- five workflow slides.

The README hero, repository preview, OG card, and journey slide 04 were also
inspected at native size. The README caption now sits inside the room image and
the repository image no longer overlaps its footer. No clipped text, image
cropping errors, incorrect version labels, low-contrast controls, or accidental
three-style-card treatment remained. `launch/manifest.json` and
`launch/ALT-TEXT.md` provide a unique one-to-one description of only the
content visible in each asset.

## Release gate and CI

CI retains website build, rendered-route, lint, browser E2E, link, privacy,
secret, fresh-install, and example checks. The Node 20/22 repository job now
also runs the committed Atlas snapshot validator, website sync drift check,
controlled benchmark validator, and launch manifest validator. It does not call
Banana, perform live research, or execute unstable retailer checks.

Built-route tests render `/styles` and all three guide routes before deployment.
The external lychee job excludes only the production Sites domain, with the
rationale recorded beside the exclusion. The equivalent local command passed
with 15 OK, 0 errors, 6 excluded production-domain URLs, and one redirect.
Production URL checks and smoke testing are explicitly a separate post-deploy
release gate; neither the report nor release notes claim that gate has passed.

## Self-review

- No user/private room photo or inspiration was used; the benchmark source is
  the repository's fictional public demo.
- Provider interaction IDs are recorded for reproducibility, but no API key,
  credential, local absolute path, or private provider state appears in the
  public benchmark.
- The baseline prompts/calls use no Atlas signals or references. Guided
  prompts cite the exact relevant pack/version, attach hashed visuals from that
  snapshot, and do not introduce a different resident brief.
- Release copy avoids affiliate claims, testimonials, dimensional proof, and
  unsupported claims about universal prompt quality.
- Production Atlas research, Roomfile workflow behavior, and public website
  feature behavior were not modified.

## Concerns and follow-up

1. Deploy the saved site version, then run the separate production URL and
   smoke gate. No production availability claim is made before that check.
2. Before publishing v0.3.0, rerun the full gate against the final integrated
   branch because this task shares a worktree history with other implementation
   work.
