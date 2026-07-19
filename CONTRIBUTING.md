# Contributing to Roomfile

Thank you for helping make interior-design agents more truthful and useful.

## Before opening a pull request

1. Keep all examples fictional and remove personal room photos, addresses, ZIP
   codes, budgets, account data, retailer credentials, and provider state.
2. Add a fixture for any geometry, normalization, validation, or retailer-data
   behavior.
3. Preserve the separation between visual approximation and dimensional proof.
4. Do not add purchasing, checkout, affiliate links, seller communication,
   contractor commitments, or structural/electrical instruction.
5. For a Style Atlas contribution, preserve the distinction between historical
   core, current usage, and commercial shorthand. User evidence must continue
   to outrank any pack signal.
6. Run the complete local test suite.

```bash
npm test
npm run test:skill
npm run validate:example
npm run smoke:fresh
npm run check:privacy
npm run validate:atlas
npm run validate:benchmark
npm run validate:launch
npm run sync:styles:check
npm --prefix website ci
npm run test:website
npm --prefix website run lint
npm --prefix website run test:e2e
```

The website test renders every internal route, including the Style Atlas.
External link checking excludes only the production Sites domain before
deployment. A release owner must run production URL and smoke checks after
deploying the saved Sites version; pre-deployment CI does not claim that gate.

## Style Atlas contributions

Read the full
[research and image-license checklist](skills/roomfile/references/style-atlas/CONTRIBUTING.md)
before proposing a field guide. A pack needs cited claim coverage, an
evidence-led quick guide and field guide, structured signals, rights-verified
visuals, complete attribution, and validation. Live project research does not
automatically enter the built-in Atlas.

## Pull requests

Keep changes focused. Explain the user problem, the evidence behind the change,
and the verification you ran. False-fit fixes should include the smallest
reproducing geometry and product fixture.

By contributing, you agree that your contribution is licensed under
Apache-2.0.
