# Task 1 — v0.3 schema, migration, resolver, and Atlas validation

## Delivered

- Updated Roomfile's package and consumer schemas to `0.3.0`, while accepting
  `0.1.0`, `0.2.0`, and `0.3.0` project data with an upgrade warning for old
  projects.
- Added an empty, versioned `inspiration/style-context.json` to profiled and
  neutral initialization, and added idempotent migration support that changes
  only schema-version fields plus an absent style-context file.
- Added the v0.3 style-context and style-pack schemas, plus optional
  `style_context` in the render request contract without relaxing required
  `style_evidence`.
- Added dependency-free style resolution and Style Atlas validation, including
  root CLI wrappers. Resolver matching is exact after case/punctuation/
  whitespace normalization; misses return `needs-live-research`.
- Added focused temporary-fixture tests for resolver and Atlas constraints,
  and extended initialization, migration, project-validator, smoke, skill,
  and package-contract coverage.

## RED / GREEN record

1. RED: `node --test tests/style-atlas.test.mjs; node --test tests/init-project.test.mjs tests/migrate-project.test.mjs`
   failed as expected: missing resolver/Atlas validator modules, initialization
   emitted `0.2.0`, and migration rejected `--to 0.3.0`.
2. GREEN: focused schema/tooling tests passed after the minimal implementation.
3. RED: `node --test tests/style-atlas.test.mjs tests/skill-contract.test.mjs tests/repository-contract.test.mjs`
   failed as expected because `package.json` still declared `0.2.0`.
4. GREEN: package version, schemas, and validation tooling passed.
5. RED: `node --test tests/validate-project.test.mjs` failed as expected for a
   style context with five reference images.
6. GREEN: project validation now rejects invalid v0.3 style contexts.

## Verification

- `node --check skills/roomfile/scripts/validate-project.mjs`
- `git diff --check`
- `npm test` — 28 passing tests.
- `npm run test:skill` — valid.
- `npm run smoke:fresh` — passed.
- `npm run validate:example` — passed; the committed v0.2 public example is
  intentionally accepted with its upgrade warning.

## Files changed

- Core scripts: `lib`, initialization, migration, project validation, new
  resolver and Atlas validator (with root CLI wrappers).
- v0.3 schemas: consumer schemas, style context, and Atlas style-pack/context
  schemas.
- Tests, fresh-install smoke, and skill structural validator.
- Root package and lockfile version.

## Self-review

- Kept the resolver deterministic: it compares only normalized canonical names,
  IDs, and aliases—no fuzzy match or style allowlist fallback.
- Kept migration non-destructive: it preserves all non-schema fields and skips
  rewrites already at `0.3.0`; it creates style context only if absent.
- Atlas fixture tests use generated temporary data, not production style packs.
- Did not touch website files or author any production style-pack content.

## Commit

`e4869c3f628346cbe63be1d0373e4f0fa87ea701`

## Concerns

None. The existing public example remains at `0.2.0` deliberately so the
upgrade-warning path is continuously exercised; `validate:example` succeeds.

## Fix report — review follow-up

### Changes

- Replaced the partial project-side style-context check with a shared,
  dependency-free validator equivalent to the published schema constraints:
  exact top-level and nested properties, required nonempty identifiers,
  RFC 3339 timestamps, signal record shapes, absolute live-research URIs, and
  the four-image cap.
- Made style resolution Unicode-aware with NFKC normalization, Unicode case
  folding, and Unicode letter/number preservation. Canonical names and aliases
  now resolve across Unicode punctuation and whitespace, while unknown Unicode
  styles return `needs-live-research`.
- Made the consumer and Atlas style-context schemas mechanically identical and
  added a drift-prevention test.

### RED / GREEN

- RED: `node --test tests/style-atlas.test.mjs tests/validate-project.test.mjs tests/skill-contract.test.mjs`
  failed as expected: 11 schema-invalid style-context cases were accepted,
  three Unicode resolver cases returned exit 2, and the two schemas differed.
- GREEN: the same focused command passed 32 tests/subtests after the minimal
  contract checker, Unicode normalizer, and canonical schema update.

### Full verification

- `git diff --check` — clean.
- `npm test` — 45 tests/subtests passed.
- `npm run test:skill` — valid.
- `npm run smoke:fresh` — passed.
- `npm run validate:example` — passed with the expected v0.2 upgrade warning.

### Fix implementation commit

`9a991e5491f5daa34c8619c2c7ee363fa670c3f8`

### Fix concerns

None.
