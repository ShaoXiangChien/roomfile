import type { Metadata } from "next";
import { CodeBlock, DocsShell, Note } from "../../components/site-chrome";

export const metadata: Metadata = { title: "Rendering" };

export default function Rendering() {
  return (
    <DocsShell
      eyebrow="Provider-neutral images"
      title="Rendering"
      intro="Banana is preferred, optional, and contained behind a durable render request so the project survives provider changes."
    >
      <section>
        <h2>The render contract</h2>
        <CodeBlock>{`{
  "concept_id": "mid-century-modern",
  "canonical_images": ["assets/source/source-room.png"],
  "locked_facts": ["same windows", "same sofa", "same camera"],
  "allowed_changes": ["coffee table", "lamp", "textiles"],
  "style_evidence": ["warm walnut", "sculptural lighting"],
  "style_context": {
    "pack_refs": [{"id": "mid-century-modern", "version": "0.3.0"}],
    "adopted_signals": ["low horizontal masses"],
    "rejected_signals": ["generic starburst décor"],
    "user_overrides": ["keep the deep existing sofa"]
  },
  "output": "assets/generated/refined.png"
}`}</CodeBlock>
      </section>

      <section>
        <h2>Prompt priority</h2>
        <p>
          Room locks come first, followed by user overrides, adopted signals,
          legacy style evidence, and pack guidance. Rejected signals and
          clichés become negative guidance; no Atlas pack may override the
          actual room or the resident.
        </p>
      </section>

      <section>
        <h2>Banana first, with continuity</h2>
        <p>
          Roomfile translates the contract into a Banana prompt and stores
          provider interaction IDs in <code>.runtime/</code>. Refinements chain
          from the selected concept so the camera and visual identity do not
          reset every turn.
        </p>
        <p>
          If Banana is unavailable, Roomfile may use another installed
          image-generation adapter with the same contract. If no adapter is
          available, it emits a ready-to-use rendering brief instead of
          inventing a result.
        </p>
      </section>

      <section>
        <h2>Privacy and cost</h2>
        <p>
          Roomfile estimates provider cost before a batch and records the model,
          resolution, and result for each image. It asks before sending private
          room photos to a new external provider.
        </p>
        <Note title="Visual approximation">
          <p>
            Every photorealistic output is labeled: “Visual approximation —
            verify dimensions, color, material, and availability before
            purchasing.” Only measured geometry and the deterministic fit
            checker may claim physical fit.
          </p>
        </Note>
      </section>

      <section>
        <h2>Locked architecture</h2>
        <p>
          Doors, windows, flooring, fixed lighting, outlets, radiators, HVAC
          vents, and landlord-protected surfaces remain unchanged unless the
          user explicitly unlocks them.
        </p>
      </section>
    </DocsShell>
  );
}
