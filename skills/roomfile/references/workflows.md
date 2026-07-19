# Roomfile workflows

Use one active room at a time. Persist each result before moving to the next
stage so another agent can resume without asking the user to upload the same
room again.

Apply this evidence hierarchy to every style decision:

1. Measured and observed room truth, including locked architecture.
2. The user's concrete reactions, inspiration observations, anti-references,
   and explicit overrides.
3. Adopted pack signals.
4. General pack guidance.

A style label alone is a hypothesis, never sufficient render evidence. User evidence
remains authoritative when it conflicts with the Atlas.

## `status`

Read the project manifest and active room. Report: completed stages, missing
shopping-profile fields, critical facts, budget committed, approved concept,
product evidence freshness, and two or three useful next commands. Recommend
completing `setup_status: needs-profile` before sourcing. Do not mutate the
project. Mention missing or incomplete style context only when it materially blocks
the next design decision; it is not mandatory setup.

## `style`

Accept a style name, comparison, or research question. Follow
`style-atlas.md`: resolve aliases against the index, progressively load the
matched packs, and explain historical core, current expressions, misreadings,
relevant visuals, and questions for this user's room. Compare design logic,
composition, materials, density, use, and framing rather than palette alone.
When coverage is unknown or insufficient, perform cited live research. If an
initialized project exists, save the note under `inspiration/research/`.
Without a project, return cited results in the response and do not write a
research note. Never guess the nearest pack or treat built-in packs as the
styles Roomfile supports.

## `taste`

Accept public links, screenshots, saved product images, or natural-language
reactions. For each source, ask what the user likes or dislikes when the answer
is not obvious. Record evidence by color, material, form, era, density,
contrast, lighting, and feeling. Maintain anti-references and contradictions.
Decompose that evidence before resolving any label. Use the Atlas to ask
sharper questions, then write adopted, rejected, uncertain, or overridden pack
signals with provenance to `inspiration/style-context.json`. Multiple packs
or zero packs are valid. Summarize the result in `STYLE.md`; do not force a
single style label.

## `capture`

Register canonical source photos with stable filenames and viewpoints. Capture
room boundary, ceiling height when relevant, doors and swings, windows,
outlets, vents, radiators, fixed lighting, flooring, landlord-protected
surfaces, circulation, and furniture that must remain. Keep uncertain values
in `facts.json` as observed or inferred. Ask for physical measurements only
when they materially affect the next decision.

## `brief`

Combine purpose, household, taste evidence, inventory, rental restrictions,
budget, geometry, and unresolved questions. Separate hard constraints from
preferences. Summarize adopted, rejected, and uncertain signals plus user
overrides and contradictions. A brief does not require a pack. Run validation,
then present the brief for approval before generating concepts.

## `explore`

Create three directions by default so the user can compare materially different
compositions and design logic, not only color. Derive every direction from the
user's evidence. Use pack knowledge to make composition, material, density, and
use materially different, but never turn built-in packs into presets or an
allowlist. Accept any style. Run additional rounds or use different direction
counts when the user asks. Write `concept.json` before rendering. Preserve
canonical viewpoint and locked architecture. Compare directions by feeling,
materials, furniture strategy, budget pressure, maintenance, and likely
sourcing difficulty.

## `refine`

Select one concept ID and create a new version. Repeat locked architectural
facts and retained products in the render request. Change only the requested
elements. Record interaction continuity in `.runtime/render-sessions.json`.
Preserve the previous version and the reason for each revision. Retain pack refs and
user overrides; change only the style signals the user requested.

## `place`

Collect a product URL or image, reliable dimensions, and intended location.
Add it as `candidate`, run the fit checker, and render the scaled SVG. Only if
dimension-based fit succeeds may the agent create a visual approximation.
When fit fails, show the conflict and propose smaller specifications rather
than manipulating the render to make the item appear to fit.

## `source`

Before searching, require a country or region, ISO currency, measurement unit,
and `retailer_strategy`. Ask for any missing values and write them to
`roomfile.json`. Request a postal code only when delivery or local availability
is part of the current decision. Translate an approved concept into roles and
measurable specifications. Search user-preferred retailers first, or propose
locally available sources when the user selected `agent-suggested`. Retain at
least one alternative for major furniture categories. Mark products
`shortlisted`; only the user may approve them.

## `plan`

Require an approved concept and audited products. Group work into: measure and
sample, order long-lead items, assemble large furniture, place lighting and
rugs, add textiles and art, then style and review. Include price subtotal,
contingency, delivery/assembly notes, dependencies, return windows, and a final
on-site verification checklist.

## `audit`

Run project validation and fit checking. Inspect render locks, critical
measurements, stale retailer evidence, seller changes, unavailable items,
budget, alternatives, rental restrictions, and approval state. Also flag a
render that used only a style label, stale pack refs, pack signals that
overrode user evidence, unlicensed reference images, or invented historical
or cultural claims. Never report the room ready to execute while critical
errors remain.
