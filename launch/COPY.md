# Roomfile v0.1.1 launch copy

Edit dates, links, and any generated-image notes before publishing.

## X

AI can generate a beautiful room in seconds. Then it forgets the window, moves
the radiator, loses your measurements, and rarely connects the result to
furniture that can actually be bought.

I built Roomfile: an open-source interior-design skill for Codex.

It works with any room and any style: keeping room truth and taste in a local
project, exploring real alternatives, checking furniture fit with deterministic
geometry, and turning the selected idea into dated regional sourcing and a
phased plan.

No subscription. Apache-2.0.

`npx skills add ShaoXiangChien/roomfile`

[SITE_URL]

## LinkedIn

Most AI interior-design demos end with a beautiful image. Decorating an actual
room starts after that image.

The model has to remember the room, fixed architecture, rental restrictions,
existing furniture, budget, and the decisions made over many rounds. It also has
to distinguish “this looks plausible” from “this product has verified dimensions
and fits.”

I built Roomfile to make that workflow a project instead of a one-shot prompt.
It is an open-source Agent Skill, tested in Codex, that:

- turns inspiration into specific taste evidence;
- captures a canonical room once;
- derives distinct directions from your evidence, without a fixed style catalog;
- keeps visual rendering separate from deterministic fit checks;
- sources dated regional candidates with identifiers, sellers, dimensions, and
  availability evidence—the public example happens to use IKEA US and Amazon US;
- creates a phased shopping and installation plan.

Personal room files remain local and gitignored. Roomfile has no subscription;
external model/API costs may apply.

Apache-2.0: [GITHUB_URL]

## Reddit

**Title:** I built an open-source Codex skill for room decorating that
remembers the room and checks furniture fit

I kept running into the same problem with AI room generators: the first image
looks nice, but multi-round work gets fragile. The model forgets constraints,
you upload the room again, and the final design rarely tells you which furniture
can actually be bought or whether it fits.

Roomfile stores the work in a private local project:

1. taste evidence from links/screenshots;
2. canonical room photos, measurements, openings, and rental constraints;
3. three deliberately different concepts by default, with arbitrary styles and
   additional rounds supported;
4. refinement with locked architecture and inventory;
5. deterministic scaled layout and collision/clearance checks;
6. current product sourcing with IKEA article numbers, Amazon ASINs, seller,
   dimensions, retrieval date, and ZIP-delivery evidence;
7. phased execution and budget plan.

The public demo is a completely fictional apartment. Eclectic Mid-century
Modern, Bauhaus, and Japandi demonstrate three possible directions; they are
examples, not presets. Renders are always labeled visual approximations; only
the geometry checker can claim fit.

It is Apache-2.0 and tested in Codex:

`npx skills add ShaoXiangChien/roomfile`

[GITHUB_URL]

I’d especially value feedback on the project format, fit-check edge cases, and
retailer verification policy.

## Hacker News

**Title:** Show HN: Roomfile – an open-source interior-design skill that
remembers constraints and checks furniture fit

Roomfile is a file-based Agent Skill for long-running room decorating
projects.

The problem: existing AI tools generate attractive rooms but forget constraints
across rounds and rarely connect the result to furniture that can actually be
bought. Roomfile keeps taste, canonical room data, measured geometry, concepts,
products, and decisions in a local gitignored folder.

Image generation remains useful for exploration, but fit claims come from a
dependency-free deterministic Node checker. Sourcing records IKEA article
numbers, Amazon ASINs, seller/manufacturer distinctions, dimensions, price,
availability, ZIP delivery result, and retrieval date.

The repository includes a fictional apartment example, a static docs site, and
no accounts, analytics, affiliate links, checkout, or subscription.

Apache-2.0, Codex-first:
[GITHUB_URL]
