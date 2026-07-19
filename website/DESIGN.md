# Roomfile website design register

## Direction

Contemporary interior magazine: large editorial typography, decisive image
scale, asymmetric grids, folio numbers, margin notes, hairline rules, and dense
product information. The site should feel like a designed journal about a room
in progress, not a SaaS landing-page component library.

## Tokens

- Paper: `#F1EADF`
- Ink: `#191713`
- Cream: `#FFF9EF`
- Rust: `#B8522F`
- Olive: `#4F5B3D`
- Signal blue: `#245EE8`, reserved for interaction, focus, and measurement
- Serif: Newsreader
- Sans: Manrope
- Mono: IBM Plex Mono

## Composition

- Full-bleed room images establish the emotional register.
- Use a 1440px editorial grid with narrow folio columns and wide image fields.
- Pair very large serif headlines with small uppercase mono annotation.
- Use borders and background shifts to separate chapters.
- Product sourcing uses an annotated room beside a dense ledger.
- Case stories use before/after spreads, not style cards.
- The Style Atlas index uses one lead story, one offset story, and one quieter
  continuation rather than three equal cards.
- Field guides alternate wide annotated plates, margin interpretation,
  compact signal ledgers, and dense source records.

## Interaction

- Native range input moves through revisions and remains fully keyboard
  operable.
- Product pins and ledger rows share one focus/highlight state and work with
  mouse, touch, and keyboard.
- Motion is limited to image reveals, revision transitions, pin highlighting,
  and small image scale changes.
- `prefers-reduced-motion` removes transitions and smooth scrolling.
- Signal blue indicates focus, active controls, and measured geometry only.

## Anti-references

- No glassmorphism, ambient gradients, glow effects, or floating shadow cards.
- Avoid repetitive rounded rectangles and evenly divided three-column feature
  sections.
- Do not use a circular “R” app icon as the masthead.
- Do not use the homepage as a command reference or policy page.
- Do not place Bauhaus, Japandi, and MCM side by side as presets.
- Do not detach image credit, institution, source, or license from its plate.
