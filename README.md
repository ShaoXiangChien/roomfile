# Roomfile

## Design your home, together.

Roomfile is an open-source interior design skill for coding agents. It helps
your AI understand the space you have, discover what you love, iterate on the
design with you, try real furniture, and turn the final idea into a room you
can actually create.

![A Mid-century Modern living room evolving from its original state into a warm, layered design.](launch/readme-hero.png)

```bash
npx skills add ShaoXiangChien/roomfile
```

[See a room take shape](https://roomfile-shaoxiangchien.ericchien21.chatgpt.site/examples/apartment)

## One continuous design project

Roomfile gives an agent a repeatable way to work with you through the whole
decorating process:

1. **Meet the room** — understand its photos, layout, existing furniture, daily
   use, and anything that cannot change.
2. **Find what feels like you** — turn links, screenshots, products, likes, and
   dislikes into specific taste evidence without forcing a style label.
3. **Design it together** — explore and refine ideas while keeping earlier
   decisions and the room itself intact.
4. **Try the real thing** — place furniture you find, compare it with the
   design, and check its measured footprint separately from the image.
5. **Make it real** — research purchasable pieces, compare sources, manage the
   budget, and build a phased plan for the room.

Calling `$roomfile` without a command resumes with `$roomfile status`.

## Quick start

```text
$roomfile init
$roomfile taste
$roomfile capture living-room
$roomfile brief
$roomfile explore
$roomfile refine
$roomfile place
$roomfile source
$roomfile plan
$roomfile audit
```

During `init`, Roomfile asks where you live, which currency and measurement
units you use, your budget, and where you prefer to shop. If you have no
preferred retailers, you can ask the agent to suggest locally available
sources. These answers guide sourcing later instead of applying a global store
list.

## Selected homes

The public examples show three different projects rather than a catalog of
style presets:

- a warm, collected **Mid-century Modern living room**;
- a compact **Bauhaus workspace** designed around focus and reversible storage;
- a quiet **Japandi bedroom** designed around rest and low visual weight.

The living-room story includes a scaled plan, iterative renders, a product
placement test, and a researched ledger with pieces available from sources
including IKEA and Amazon. Example prices and availability are dated evidence,
not permanent claims.

## Images suggest. Measurements decide.

Every generated room image is a:

> Visual approximation — verify dimensions, color, material, and availability
> before purchasing.

Only structured measurements and the dependency-free fit checker may report
physical fit. It checks boundaries, overlap, door swings, clearances, and
circulation.

```bash
node skills/roomfile/scripts/check-fit.mjs \
  --geometry examples/us-apartment/roomfile/rooms/living-room/geometry.json \
  --products examples/us-apartment/roomfile/rooms/living-room/products.json \
  --json
```

## Project format

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

Personal photos, postal codes, budgets, and provider state remain in the local
project. Private projects are gitignored by default. Roomfile asks before
sending private images to a new external renderer.

## Compatibility

| Environment | Status |
| --- | --- |
| Codex | officially tested |
| Agent Skills-compatible coding agents | best-effort |
| Banana / Gemini image models | preferred, optional |
| Other image providers | provider-neutral fallback |
| Node.js | 20+ |

Roomfile v0.2.0 includes a preference-first project profile and supports
three-letter ISO currencies. Existing v0.1.0 projects can be validated and
migrated:

```bash
node skills/roomfile/scripts/migrate-project.mjs \
  --project /absolute/path/to/roomfile \
  --to 0.2.0 \
  --json
```

## Development

```bash
npm test
npm run test:skill
npm run validate:example
npm run check:privacy
npm run test:website
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the release workflow.

## License

Copyright 2026 Roomfile contributors.

Licensed under [Apache-2.0](LICENSE).
