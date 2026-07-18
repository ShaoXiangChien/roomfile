# Roomfile workflows

Use one active room at a time. Persist each result before moving to the next
stage so another agent can resume without asking the user to upload the same
room again.

## `status`

Read the project manifest and active room. Report: completed stages, missing
critical facts, budget committed, approved concept, product evidence freshness,
and two or three useful next commands. Do not mutate the project.

## `taste`

Accept public links, screenshots, saved product images, or natural-language
reactions. For each source, ask what the user likes or dislikes when the answer
is not obvious. Record evidence by color, material, form, era, density,
contrast, lighting, and feeling. Maintain anti-references and contradictions.
Summarize a working hypothesis in `STYLE.md`; do not force a single style label.

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
preferences. Run validation. Present the brief for approval before generating
concepts.

## `explore`

Create three directions by default so the user can compare materially different
compositions and design logic, not only color. Derive every direction from the
user's style evidence; accept arbitrary style strings and enforce no style
allowlist. Mid-century Modern, Bauhaus, and Japandi are public-demo examples,
not presets. Run additional rounds or use different direction counts when the
user asks. Write `concept.json` before rendering. Preserve canonical viewpoint
and locked architecture. Compare directions by feeling, materials, furniture
strategy, budget pressure, maintenance, and likely sourcing difficulty.

## `refine`

Select one concept ID and create a new version. Repeat locked architectural
facts and retained products in the render request. Change only the requested
elements. Record interaction continuity in `.runtime/render-sessions.json`.
Preserve the previous version and the reason for each revision.

## `place`

Collect a product URL or image, reliable dimensions, and intended location.
Add it as `candidate`, run the fit checker, and render the scaled SVG. Only if
dimension-based fit succeeds may the agent create a visual approximation.
When fit fails, show the conflict and propose smaller specifications rather
than manipulating the render to make the item appear to fit.

## `source`

Translate an approved concept into roles and measurable specifications before
searching. Search current listings for the project-configured region, favor
preferred retailers, and retain at least one alternative for major furniture
categories. Mark products `shortlisted`; only the user may approve them.

## `plan`

Require an approved concept and audited products. Group work into: measure and
sample, order long-lead items, assemble large furniture, place lighting and
rugs, add textiles and art, then style and review. Include price subtotal,
contingency, delivery/assembly notes, dependencies, return windows, and a final
on-site verification checklist.

## `audit`

Run project validation and fit checking. Inspect render locks, critical
measurements, stale retailer evidence, seller changes, unavailable items,
budget, alternatives, rental restrictions, and approval state. Never report
the room ready to execute while critical errors remain.
