# Style Atlas controlled benchmark

This public-demo benchmark asks a narrow question: when the room, camera,
locks, and resident evidence stay fixed, what visibly changes when the render
brief can also use one Roomfile Style Atlas pack?

It is a reproducible prompt comparison, not a beauty contest or proof that one
prompt will always outperform another. Image models are stochastic. A single
pair can reveal useful differences and failure modes, but it cannot establish
objective superiority.

## Controlled setup

- One fictional source room is reused for all six renders.
- Every request preserves the same camera, windows, door, flooring, fixed
  lighting, architecture, existing sofa, and existing dining table.
- Each style pair shares the same resident evidence. The baseline receives
  that evidence without Atlas guidance. The guided request adds the exact
  `0.3.0` pack snapshot, adopted and rejected signals, and two or three
  licensed reference images from that pack.
- All calls use the same provider model, resolution, aspect ratio, and source
  image. Each output is a fresh edit of the canonical source, not a chained
  edit of another benchmark result.

The source room and all benchmark prompts are fictional public-demo material.
No user room photo, private inspiration, address, retailer profile, or provider
credential is included.

## Files

- `benchmark.json` declares the six-run matrix.
- `locks.json` is the common room truth.
- `requests/` stores provider-neutral Roomfile render requests.
- `prompts/` stores the exact provider-ready prompts used for generation.
- `source/` contains the shared fictional room.
- `outputs/` contains the six generated images.
- `cost-estimate.json` records the preflight estimate.
- `generation-log.json` reconciles each call with its output and reported cost.
- `review.json` and `REVIEW.md` record the human comparison.

## Review rubric

Each image is reviewed from 1 (poor) to 5 (strong) on:

1. **Style depth** — does it express a design logic beyond a familiar token?
2. **Room preservation** — are the fixed room and retained furniture intact?
3. **Material differentiation** — are the pair's differences materially
   relevant rather than a palette swap?
4. **Cliché avoidance** — does it avoid reducing the requested style to its
   most commercial shorthand?
5. **Evidence subordination** — does the Atlas remain subordinate to the
   resident's stated evidence and overrides?

Review notes identify concrete visible evidence and failure modes. Scores are
editorial judgments, not measurements or model rankings.

## Limitations

These images are visual approximations. They do not prove furniture fit,
material color, construction feasibility, product availability, or historical
authenticity. Deterministic measurements remain authoritative for physical
fit. Re-running the same prompt may produce a different result.

Validate the committed snapshot with:

```bash
npm run validate:benchmark
```
