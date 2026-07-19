# Style Atlas behavior

The Style Atlas is a researched lens for better design questions. It is not a
set of presets, an allowlist, or a substitute for the user's inspiration.
Any style remains supported.

## Progressive loading

Resolve `ROOMFILE_SKILL_DIR`, then:

1. Read `references/style-atlas/index.json` first.
2. For a named style or alias, run:

   ```bash
   node "$ROOMFILE_SKILL_DIR/scripts/resolve-style.mjs" \
     --style "USER QUERY" \
     --json
   ```

3. For each resolved pack, read only `quick-guide.md` and `signals.json` for a
   normal `style`, `taste`, or `explore` request.
4. Read `field-guide.md`, `visuals.json`, and `sources.json` only for a deep
   question, conflict, comparison, cultural or historical claim, or
   render-reference selection.

For a known style, explain its historical core, current expressions,
misreadings, and relevant visuals, then ask questions that reveal what the
user actually likes. For a comparison, compare design logic, composition,
materials, spatial density, use, and cultural or historical framing—not only
palette.

## Live-research decision

Return `needs-live-research` and research before interpreting when:

- no pack resolves;
- the request names a substyle, region, era, or current trend outside pack
  coverage;
- user evidence conflicts with the pack;
- the pack's contemporary layer is older than six months;
- the evidence cannot be explained without guessing.

Research in this order:

1. museums, official archives, designer foundations, and original works;
2. academic or curatorial work and practitioner interviews;
3. design media, social sources, and retailers only as evidence of present-day usage.

Save an original, cited note under `roomfile/inspiration/research/`. Add the
URLs and retrieval dates used to `style-context.json.live_research_sources`.
Do not download a remote image until an allowlisted license has been
individually verified. A link or screenshot can remain private user
inspiration without being republished.

Research gives the agent better language and questions. User evidence remains
authoritative; do not use research to correct taste.

## Style-context recording

Treat a style label as a working hypothesis, never as sufficient render
evidence. Decompose concrete reactions first. Record:

- pack ID, version, and `read_at`;
- adopted, rejected, and uncertain signals;
- explicit user overrides and contradictions;
- cited live-research sources;
- up to four intentionally selected Atlas reference images and why they help.

Multiple packs or zero packs are valid. Preserve provenance in signal `source`
and `reason` fields. Do not silently turn an agent inference into a user
preference.

## Rendering use

Select Atlas images only from each pack's `visuals.json`; never construct a
path from a visual ID. The render-brief builder validates the shared v0.3
style-context contract, resolves declared assets, and keeps public Atlas
references separate from private canonical room inputs.

Prompt precedence is fixed:

1. room locks;
2. user overrides;
3. adopted signals;
4. legacy style evidence;
5. general pack guidance.

Rejected signals, pack clichés, and negative prompt guidance belong only in
the negative section. Pack guidance cannot weaken room truth, user evidence,
provider consent, or deterministic fit checks.
