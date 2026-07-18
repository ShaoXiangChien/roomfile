# Rendering adapter

Rendering is a visual communication layer. It does not replace measured
geometry, product evidence, or user approval.

## Adapter order

1. Use Banana when installed and configured.
2. Otherwise use an available image-generation or image-editing skill/tool.
3. If no renderer is available, save the complete `render-request.json` and a
   natural-language production brief so the user can render elsewhere.

Do not duplicate Banana model IDs, pricing tables, or retry logic here. Load
Banana's own instructions immediately before invoking it.

Generate the provider-ready prompt mechanically before calling Banana:

```bash
node "$ROOMFILE_SKILL_DIR/scripts/build-render-brief.mjs" \
  --request ABSOLUTE_RENDER_REQUEST_JSON \
  --output ABSOLUTE_RENDER_BRIEF_MD \
  --adapter banana \
  --json
```

Use the generated brief as input, but keep the JSON file authoritative.

## Render request

Provide canonical room views, concept ID and version, visual goal, style
evidence, locked architectural facts, retained inventory, allowed changes,
product references, camera viewpoint, output path, and the mandatory visual
approximation disclaimer.

Paths in a concept's `render-request.json` are relative to the active room
directory (`rooms/<slug>/`), even though the request is stored below
`concepts/<concept-id>/`.

Use positive visible constraints. State that walls, windows, doors, flooring,
ceiling, vents, outlets, fixed lighting, and camera viewpoint MUST remain
unchanged when locked. Repeat the most important locks in every refinement.

## Continuity

Store provider and interaction IDs under `.runtime/render-sessions.json`.
Reuse the latest valid interaction for refinements. If provider continuity is
unavailable, attach the canonical source image, latest approved render, and
structured render request. Never require the user to re-upload a file already
available locally.

## Failure handling

If generation fails, preserve the prior concept version and interaction state.
Record the error without marking the concept approved. Never weaken spatial or
architectural constraints just to obtain a prettier image.

## External processing

Before first use of a provider for a private project, explain that the selected
room images will be sent to that provider and ask for confirmation. Record only
the consent decision and provider name locally, not credentials.
