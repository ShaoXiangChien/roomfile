# Roomfile

## Your room, remembered.

Roomfile is an open-source Agent Skill for decorating any room in any style. It
keeps taste, constraints, products, and decisions in one durable local project,
then separates visual approximation from deterministic furniture fit and
current product evidence. Region, currency, units, retailers, and local rules
are project settings.

![Roomfile shows the same fictional apartment before decorating and as a refined Eclectic Mid-century Modern concept.](launch/readme-hero.png)

```bash
npx skills add ShaoXiangChien/roomfile
```

Roomfile is tested primarily in Codex. It has no subscription; external
model/API costs may apply.

[Read the docs and explore the fictional apartment case study](https://roomfile-shaoxiangchien.ericchien21.chatgpt.site/examples/apartment)

## Why Roomfile

General image assistants can make an attractive room, but long decorating
projects expose four gaps:

- You may not know your style yet; labels are less useful than reactions to
  real inspiration.
- The model forgets measurements, rental rules, fixed elements, or the exact
  room viewpoint.
- A good render rarely explains which furniture can actually be bought, will
  fit, or fits the budget.
- A product listing can look right online without proving its footprint,
  delivery, seller, or compatibility with the room.

Roomfile follows one umbrella skill with focused commands, persistent context,
and deterministic checks.

## Quick start

```text
$roomfile init
$roomfile taste
$roomfile capture living-room
$roomfile brief
$roomfile explore
$roomfile refine
$roomfile source
$roomfile place
$roomfile plan
$roomfile audit
```

Calling `$roomfile` without a command behaves like `$roomfile status`.

Private initialization creates a gitignored `roomfile/` folder:

```text
roomfile/
├── roomfile.json
├── HOME.md
├── STYLE.md
├── INVENTORY.md
├── inspiration/
├── rooms/<slug>/
│   ├── geometry.json
│   ├── facts.json
│   ├── products.json
│   ├── concepts/
│   └── EXECUTION.md
└── .runtime/
```

## One room, three directions

The included fictional apartment keeps the same sofa, dining table, windows,
radiator, flooring, entry swing, and camera across three intentionally different
explorations:

| Direction | Material and composition |
| --- | --- |
| Eclectic Mid-century Modern | amber light, walnut, olive, rust, tactile layers, collected objects |
| Bauhaus | primary accents, tubular steel, geometric functional contrast |
| Japandi | pale timber, textured neutrals, natural materials, negative space |

These are examples, not presets. Roomfile derives exploration directions from
each person's inspiration evidence and can explore other styles or additional
rounds.

The full example includes inspiration analysis, measurements, a scaled SVG,
fit report, comparison matrix, dated sourcing, shopping list, and phased
execution plan. It is entirely fictional.

## Fit is not a vibe

Photorealistic images are always labeled:

> Visual approximation — verify dimensions, color, material, and availability
> before purchasing.

Only structured measurements and the deterministic fit checker may claim
physical fit. The scripts detect boundary overflow, overlaps, blocked door
swings, clearance conflicts, and circulation problems.

```bash
node skills/roomfile/scripts/check-fit.mjs \
  --geometry examples/us-apartment/roomfile/rooms/living-room/geometry.json \
  --products examples/us-apartment/roomfile/rooms/living-room/products.json \
  --json
```

## Sourcing policy

For this US-configured example, the retailer priority is:

1. IKEA US and Amazon US.
2. Target, Wayfair, Walmart, The Home Depot, and Lowe’s.
3. Style-specific or independent retailers when primary sources cannot satisfy
   the role.

For IKEA, Roomfile preserves the article number, package dimensions, assembly
requirements, and dated ZIP-specific availability when accessible. For
Amazon, it preserves the ASIN, seller, shipping result, manufacturer, and
manufacturer dimensions. Marketplace dimensions must be cross-checked before
approval.

Roomfile uses no affiliate links in v0.1.0 and never purchases, enters checkout,
contacts a retailer, or communicates externally.

Projects in other regions use their configured local retailers, currency,
delivery area, and dated regional evidence.

## Rendering

Banana is the preferred renderer. Roomfile translates a provider-neutral
`render-request.json` into a structured prompt and retains interaction IDs in
`.runtime/` for multi-round continuity. If Banana is unavailable, Roomfile can
use another installed adapter with the same contract or emit a ready-to-use
render brief.

Roomfile asks before sending private room photos to a new external provider and
estimates provider cost before a batch.

## Privacy

- Personal photos, addresses, ZIP codes, budgets, and provider state stay local.
- Private projects are gitignored with a delimited block.
- Existing files and unrelated `.gitignore` rules are preserved.
- Public examples require `privacy_mode: public-demo`.
- The repository and website contain no real apartment or customer data.

## Compatibility

| Environment | Status |
| --- | --- |
| Codex | officially tested |
| Agent Skills-compatible coding agents | best-effort |
| Banana / Gemini image models | preferred, optional |
| Other installed image providers | provider-neutral fallback |
| Node.js | 20+ |

## Commands

| Command | Purpose |
| --- | --- |
| `init` | create project and collect regional, budget, retailer, privacy, and renderer defaults |
| `status` | inspect completeness and recommend next actions |
| `taste` | turn inspiration into specific evidence and anti-references |
| `capture` | register canonical photos, geometry, fixed elements, circulation, and uncertainty |
| `brief` | align taste, needs, budget, inventory, and room truth |
| `explore` | generate three intentionally different directions |
| `refine` | revise while preserving locked facts and decisions |
| `place` | test a product dimensionally and approximately visually |
| `source` | find dated current candidates with verifiable evidence |
| `plan` | sequence shopping, placement, assembly, styling, and reserve |
| `audit` | catch missing measurements, collisions, stale data, and render-to-reality gaps |

## Limitations and safety

Roomfile v0.1.0 supports reversible decorating changes in real rooms. It does
not provide structural, electrical, building-code, contractor, or purchasing
instructions. It cannot guarantee color, material, comfort, quality, price,
stock, shipping, or return policy. Recheck current retailer claims and local
delivery before spending money.

“Roomfile” has received only a preliminary collision check, not formal trademark
clearance.

## Development

```bash
npm test
npm run test:skill
npm run validate:example
npm run check:privacy
npm --prefix website ci
npm run test:website
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[complete documentation](website/app/docs).

## License

Copyright 2026 Roomfile contributors.

Licensed under [Apache-2.0](LICENSE).
