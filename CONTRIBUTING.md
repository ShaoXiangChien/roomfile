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
5. Run the complete local test suite.

```bash
npm test
npm run test:skill
npm run validate:example
npm run check:privacy
npm --prefix website ci
npm run test:website
```

## Pull requests

Keep changes focused. Explain the user problem, the evidence behind the change,
and the verification you ran. False-fit fixes should include the smallest
reproducing geometry and product fixture.

By contributing, you agree that your contribution is licensed under
Apache-2.0.
