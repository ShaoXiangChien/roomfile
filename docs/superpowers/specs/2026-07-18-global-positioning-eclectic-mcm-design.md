# Roomfile global positioning and Eclectic Mid-century Modern correction

## Purpose

Roomfile should present itself as a project-based interior-design skill for any
room, region, retailer mix, or style direction. The current public materials
overemphasize a US apartment and three named styles, making configurable example
data look like product limitations.

The Mid-century Modern example also needs to reflect the user's actual taste
evidence: a warm, collected, 1970s-inflected interpretation rather than a sparse
showroom treatment.

This change will ship as Roomfile v0.1.1.

## Product positioning

Public-facing copy will lead with these contracts:

- Roomfile works with any room and derives design directions from the user's
  inspiration, reactions, constraints, and existing inventory.
- Region, currency, measurement units, retailers, budget, and rental rules are
  project settings rather than Roomfile product boundaries.
- Mid-century Modern, Bauhaus, and Japandi are three example directions from one
  demonstration workflow, not a fixed style catalog.
- An `explore` round produces three deliberately different directions by
  default to make comparison manageable. Users can request other styles or run
  additional exploration rounds.
- The public example remains fictional. Its USD budget and IKEA US/Amazon US
  sourcing evidence remain visible where relevant, without defining the whole
  product as US-only.

The skill description, command reference, README, website, launch copy, and
tests will use this positioning consistently.

## Example naming and compatibility

Visible case-study language will use “fictional apartment” or “apartment
example,” not “US apartment” or “US rental” as the primary label.

The canonical website route will become `/examples/apartment`. The existing
`/examples/us-apartment` route will remain functional as a compatibility alias
so published links do not break. Existing repository example paths may remain
under `examples/us-apartment/` because they are versioned data paths and their
regional configuration is still accurate.

The case study may continue to state concrete facts such as USD budget,
fictional ZIP, IKEA US, and Amazon US inside sourcing and project-data sections.
Those facts describe the demonstration project only.

## Style model

Roomfile will remain style-agnostic. Style names are evidence summaries, not
closed enums or hardcoded presets.

The public materials will explain that:

- inspiration links and screenshots can indicate any aesthetic;
- specific reactions matter more than a broad label;
- directions may combine influences when the evidence supports it;
- style labels can be refined as the user learns what they like;
- the three displayed concepts are examples generated from one taste brief.

No schema will restrict concepts to Mid-century Modern, Bauhaus, or Japandi.

## Eclectic Mid-century Modern direction

The selected direction will be labeled **Eclectic Mid-century Modern**. Public
copy may mention Mid-century Modern as its familiar parent category, while the
more specific name is used in the concept card, case study, comparison matrix,
render contracts, decisions, and launch assets.

The attached inspiration photo is private input evidence. It will not be copied
into the public repository or website. Its visual signals will be translated
into a reusable evidence description:

- warm amber pools of light rather than bright uniform daylight;
- walnut and dark wood balanced with olive green, rust, burnt orange, tobacco
  brown, cream, and black;
- mushroom lamps, an arched floor lamp, and several small practical lights;
- low, comfortable forms and tactile upholstery;
- a large graphic rug with strong 1970s geometry;
- records, books, art posters, plants, and personal objects arranged as
  intentional, lived-in collections;
- a mix of Mid-century Modern, space-age, Bauhaus, and 1970s revival references;
- layered abundance without blocked circulation or arbitrary clutter.

This direction should feel warm, expressive, comfortable, and collected—not
minimal, beige, generic, or staged like a furniture showroom.

## Room-truth preservation

The regenerated images must preserve the fictional apartment's canonical
architecture and hard constraints:

- camera viewpoint and perspective;
- room boundary and circulation;
- both windows and their proportions;
- radiator, HVAC, outlets, door opening, flooring, and fixed ceiling light;
- existing warm-gray sofa and oak dining table;
- landlord-protected surfaces.

The inspiration image supplies style evidence only. It does not authorize
copying its architecture, replacing locked furniture, or claiming that pictured
products fit.

Major new furniture must not appear unless it is represented in structured
geometry and passes deterministic fit checks. The visual correction will
therefore emphasize lighting, textiles, art, plants, media, books, accessories,
and appropriately scaled storage around the existing inventory. Any product
placement remains a visual approximation until separately measured.

## Image set

Banana will regenerate three related outputs:

1. The first Eclectic Mid-century Modern exploration.
2. The approved refined direction.
3. The IKEA product-placement test based on the refined direction.

The source room, Bauhaus direction, and Japandi direction remain unchanged.
All regenerated outputs will use the same source-room view and locked facts.
The refined image will use the first exploration as continuity input, and the
placement test will use the refined image.

Before generation, the workflow will estimate and log cost. It will retain the
existing render-contract boundary, label all images as visual approximations,
and leave the previous published images intact if generation fails.

## Website and launch materials

The website will preserve its current editorial-warm visual system. This is a
content and example correction, not a redesign.

Updates include:

- neutral product positioning on the homepage and documentation;
- explicit “examples, not presets” language near the concept comparison;
- the new Eclectic Mid-century Modern label and imagery;
- a canonical `/examples/apartment` case-study route plus the old compatibility
  route;
- generic apartment wording in navigation, metadata, alt text, README, social
  copy, and repository preview text;
- refreshed README hero, Open Graph card, before/after carousel, workflow
  carousel, and associated alt text.

The case study will still show the example's actual region-specific sourcing
evidence where it helps readers understand how Roomfile records retailer data.

## Skill and project changes

The umbrella skill will:

- initialize a private room project rather than describing initialization as a
  US-only apartment action;
- continue collecting country, currency, units, ZIP/postal code, retailers, and
  local constraints;
- describe US retailer priority as the demonstration/default policy when a
  project selects the United States;
- state that other regions use project-configured retailers and local evidence;
- derive exploration directions from taste evidence without a style allowlist.

The current JSON schemas remain version-compatible. Existing US defaults and
the fictional US data fixture may remain for v0.1.1, provided they are described
as defaults or example values rather than universal restrictions.

## Validation

Acceptance requires:

- no primary marketing headline or navigation label implies Roomfile is US-only;
- the three public directions are clearly labeled as examples;
- the skill accepts arbitrary style-direction strings;
- both example URLs work, with `/examples/apartment` treated as canonical;
- all regenerated images preserve canonical room architecture and inventory;
- Eclectic Mid-century Modern is visually distinct from the old sparse version
  and matches the approved evidence description;
- render requests, concepts, decisions, comparison copy, and image assets agree;
- website, README, Open Graph, carousel assets, and alt text use the new image;
- core tests, skill validation, privacy scan, website tests, lint, build, link
  check, secret scan, and fresh-install smoke test pass;
- the public Sites deployment returns successful responses for every route and
  correct canonical metadata;
- GitHub publishes a non-draft v0.1.1 release only after deployment succeeds.

## Out of scope

- Rebuilding the website visual design.
- Replacing the unchanged Bauhaus or Japandi images.
- Publishing the user's inspiration photo.
- Turning style directions into a fixed preset library.
- Removing US sourcing support or the US example fixture.
- Claiming visual placement proves physical fit.
- Purchasing products or adding affiliate links.
