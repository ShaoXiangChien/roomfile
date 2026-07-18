# Roomfile v0.1.0 launch copy

Edit dates, links, and any generated-image notes before publishing.

## X

AI can generate a beautiful room in seconds. Then it forgets the window, moves
the radiator, loses your measurements, and rarely connects the result to
furniture that can actually be bought.

I built Roomfile: an open-source interior-design skill for Codex.

It keeps your room and taste in a local project, explores real alternatives,
checks furniture fit with deterministic geometry, and turns the selected idea
into dated IKEA/Amazon sourcing and a phased plan.

No subscription. Apache-2.0.

`npx skills add ShaoXiangChien/roomfile`

[SITE_URL]

## LinkedIn

Most AI interior-design demos end with a beautiful image. Decorating an actual
apartment starts after that image.

The model has to remember the room, fixed architecture, rental restrictions,
existing furniture, budget, and the decisions made over many rounds. It also has
to distinguish “this looks plausible” from “this product has verified dimensions
and fits.”

I built Roomfile to make that workflow a project instead of a one-shot prompt.
It is an open-source Agent Skill, tested in Codex, that:

- turns inspiration into specific taste evidence;
- captures a canonical room once;
- explores Mid-century Modern, Bauhaus, Japandi, or other distinct directions;
- keeps visual rendering separate from deterministic fit checks;
- sources dated IKEA/Amazon candidates with identifiers, sellers, dimensions,
  and availability evidence;
- creates a phased shopping and installation plan.

Personal room files remain local and gitignored. Roomfile has no subscription;
external model/API costs may apply.

Apache-2.0: [GITHUB_URL]

## Reddit

**Title:** I built an open-source Codex skill for apartment decorating that
remembers the room and checks furniture fit

I kept running into the same problem with AI room generators: the first image
looks nice, but multi-round work gets fragile. The model forgets constraints,
you upload the room again, and the final design rarely tells you which furniture
can actually be bought or whether it fits.

Roomfile stores the work in a private local project:

1. taste evidence from links/screenshots;
2. canonical room photos, measurements, openings, and rental constraints;
3. three deliberately different concepts;
4. refinement with locked architecture and inventory;
5. deterministic scaled layout and collision/clearance checks;
6. current product sourcing with IKEA article numbers, Amazon ASINs, seller,
   dimensions, retrieval date, and ZIP-delivery evidence;
7. phased execution and budget plan.

The public demo is a completely fictional US rental with Mid-century Modern,
Bauhaus, and Japandi options. Renders are always labeled visual approximations;
only the geometry checker can claim fit.

It is Apache-2.0 and tested in Codex:

`npx skills add ShaoXiangChien/roomfile`

[GITHUB_URL]

I’d especially value feedback on the project format, fit-check edge cases, and
retailer verification policy.

## Hacker News

**Title:** Show HN: Roomfile – an open-source interior-design skill that
remembers constraints and checks furniture fit

Roomfile is a file-based Agent Skill for long-running apartment decorating
projects.

The problem: existing AI tools generate attractive rooms but forget constraints
across rounds and rarely connect the result to furniture that can actually be
bought. Roomfile keeps taste, canonical room data, measured geometry, concepts,
products, and decisions in a local gitignored folder.

Image generation remains useful for exploration, but fit claims come from a
dependency-free deterministic Node checker. Sourcing records IKEA article
numbers, Amazon ASINs, seller/manufacturer distinctions, dimensions, price,
availability, ZIP delivery result, and retrieval date.

The repository includes a fictional US rental example, a static docs site, and
no accounts, analytics, affiliate links, checkout, or subscription.

Apache-2.0, Codex-first:
[GITHUB_URL]
