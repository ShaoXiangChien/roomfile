# Roomfile v0.3.0

Roomfile v0.3.0 adds the Hybrid Style Atlas: researched, cited lenses that help
an agent hold a deeper interior-design conversation without turning a style
name into a preset.

## What is new

- `$roomfile style <query>` explains a known style, compares design logic, or
  routes under-covered questions to sourced live research.
- `taste`, `brief`, `explore`, `refine`, and rendering now use an
  evidence-first style context. Resident reactions and explicit overrides
  outrank every built-in signal.
- Progressive loading starts with the Atlas index and opens quick guides,
  structured signals, field guides, and images only as the task requires.
- The initial field guides cover Mid-century Modern, Bauhaus, and Japandi.
  They are examples of the research contract, not a supported-style boundary.
- Public editorial Atlas pages are generated from the portable skill snapshot,
  with drift checked in CI.

## Research and image licenses

Each initial pack contains 25–40 cited sources and 12 rights-verified local
visuals. Historical core, current expression, and common misreadings are kept
separate. Redistributed images use only the release allowlist of CC0, Public
Domain Mark, or CC BY 4.0, with creator, source, license, transformations,
dimensions, hash, alt text, and attribution recorded per image.

Project-specific live research stays private and does not become part of the
built-in Atlas automatically.

## Schema and compatibility

Schema `0.3.0` adds `inspiration/style-context.json` and optional structured
style context in render requests. The migration from 0.2.0 to 0.3.0 preserves
existing photos, profile, taste evidence, products, concepts, and decisions and
is idempotent. The validator continues to accept 0.1.0 and 0.2.0 projects with
an upgrade warning.

```bash
node skills/roomfile/scripts/migrate-project.mjs \
  --project /absolute/path/to/roomfile \
  --to 0.3.0 \
  --json
```

## Controlled benchmark

The release includes a six-run, same-room Style Atlas benchmark: one baseline
and one guided prompt for each initial pack, with identical room locks, camera,
retained furniture, resident evidence, provider settings, cost records, and
human review. It documents visible differences and failures in both variants.
One stochastic sample is not evidence of objective model or prompt
superiority, and every output remains a visual approximation.

## Install or upgrade

```bash
npx skills add ShaoXiangChien/roomfile
```

Existing clones can pull the `v0.3.0` tag and reinstall the skill from the
repository.

## Verification

Pre-deployment verification recorded on July 19, 2026:

- `npm test`: 105 tests passed.
- `npm run test:skill`: portable skill validation passed.
- `npm run validate:example`: passed with the expected v0.2 upgrade warning.
- `npm run smoke:fresh`: fresh-install smoke test passed.
- `npm run check:privacy`: no findings.
- `npm run validate:atlas`: the committed Atlas snapshot passed.
- `npm run sync:styles:check`: no website content drift.
- `npm run validate:benchmark`: all six benchmark outputs and records passed.
- `npm run validate:launch`: all 13 launch rasters matched their dimensions and
  per-asset alt contracts.
- `npm --prefix website test`: 9 tests passed.
- `npm --prefix website run lint`: passed.
- `npm --prefix website run test:e2e`: 11 tests passed and one intentionally
  skipped.
- `npm audit --prefix website`: 0 vulnerabilities.
- `git diff --check`: passed.
- `gitleaks git --redact --verbose`: no committed-history secrets found.

The workflow repeats the root gate on Node 20 and 22. Built-route tests validate
the internal Style Atlas links before deployment; the external link check
temporarily excludes only the production Sites domain. Production URL and
smoke checks remain a separate required post-deploy release gate and are not
claimed here.
