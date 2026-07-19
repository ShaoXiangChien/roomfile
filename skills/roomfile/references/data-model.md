# Roomfile data model

`roomfile.json` is the project manifest. Markdown files remain the
human-readable record; JSON files carry facts that scripts must verify.

## Project manifest

Store schema version, setup status, project name, country, region, postal code,
ISO currency, measurement unit, budget, privacy mode, preferred retailers,
`retailer_strategy`, rendering preference, and the room registry.
`needs-profile` projects cannot source products until location, currency,
units, and retailer strategy are recorded. Use UTC ISO dates. Never store API
keys, authentication tokens, precise addresses, or payment details.

## Geometry

Use an inch-based Cartesian coordinate system. The origin is the room
boundary's upper-left reference point in the scaled diagram. Store:

- a polygon boundary with at least three points;
- openings and their required clearance rectangles;
- fixed elements;
- circulation and access clearance zones;
- product placements by center `x`, center `y`, and clockwise rotation.

Accept centimetre product dimensions and normalize them to inches during fit
checking. Edge touching is allowed; positive-area overlap is not.

## Facts

Every fact needs an ID, label, classification, source, and optional confidence.
Use `critical_for_fit: true` when an incorrect value could cause a purchase or
placement error. Critical facts must be classified `measured`.

## Concepts and rendering

A concept has a stable ID and append-only versions. Track status, style
direction, locked elements, allowed changes, decisions, and render results.
Provider-specific interaction IDs belong only in `.runtime/`.

## Style context

Store machine-readable taste provenance in
`inspiration/style-context.json`. `pack_refs` records a pack ID, version, and
`read_at`; signal arrays distinguish adopted, rejected, uncertain, overridden,
and contradictory evidence. Keep source and reason on structured signals when
known. `live_research_sources` records cited URLs and retrieval dates.
`reference_images` records no more than four declared Atlas visual IDs, paths,
and selection reasons. Multiple or zero pack refs are valid.

Keep `STYLE.md` as the human-editable summary. A label is a working hypothesis,
not enough evidence to render or a machine-verifiable fact.

## Products

Keep product role separate from product identity. Record retailer ID (IKEA
article number or Amazon ASIN), seller, manufacturer, dated source URL,
dimensions, package dimensions when available, price, availability, ZIP
delivery result, assembly, return notes, placement, and status.

`approved` products require reliable width and depth plus a dated source URL.
Marketplace claims and manufacturer claims must remain distinguishable.

## Status values

Concepts: `draft`, `selected`, `approved`, `rejected`, `archived`.

Products: `candidate`, `shortlisted`, `approved`, `rejected`, `purchased`.

Room stages: `capture-needed`, `brief-needed`, `exploring`, `refining`,
`sourcing`, `planning`, `ready`.
