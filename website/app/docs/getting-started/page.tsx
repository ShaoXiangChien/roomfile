import type { Metadata } from "next";
import { CodeBlock, DocsShell, Note } from "../../components/site-chrome";

export const metadata: Metadata = { title: "Getting started" };

export default function GettingStarted() {
  return (
    <DocsShell
      eyebrow="First room"
      title="Getting started"
      intro="Install one skill, create one private project, and move from room truth to an executable decorating plan without repeatedly rebuilding context."
    >
      <section>
        <h2>Install Roomfile</h2>
        <CodeBlock>npx skills add ShaoXiangChien/roomfile</CodeBlock>
        <p>
          Roomfile is tested primarily in Codex. The skill follows the portable
          Agent Skills format, so other compatible environments may work on a
          best-effort basis.
        </p>
      </section>

      <section>
        <h2>Initialize your private project</h2>
        <CodeBlock>$roomfile init</CodeBlock>
        <p>
          Roomfile interviews you first for country or region, delivery area
          (which can be supplied later), currency, measurement units, budget,
          room restrictions, preferred retailers, and whether the agent may
          suggest local sources. Those answers create a private{" "}
          <code>roomfile/</code> folder, which is added to a delimited{" "}
          <code>.gitignore</code> block.
        </p>
        <Note title="Local by default">
          <p>
            Your room photos, location settings, budget, and decisions remain
            private and gitignored. Existing files and unrelated ignore rules
            are never overwritten.
          </p>
        </Note>
      </section>

      <section>
        <h2>Capture the room once</h2>
        <CodeBlock>{`$roomfile capture living-room
$roomfile status`}</CodeBlock>
        <p>
          Register canonical photos, measured boundaries, openings, fixed
          elements, lighting, circulation, and uncertainty. Future renders
          reuse these files instead of asking you to upload the room again.
        </p>
      </section>

      <section>
        <h2>Move through decisions</h2>
        <ol>
          <li>
            <code>$roomfile taste</code> turns references into likes, dislikes,
            anti-references, and contradictions. The Style Atlas can sharpen
            the follow-up questions without turning a label into your whole
            preference.
          </li>
          <li>
            <code>$roomfile style &lt;query&gt;</code> opens a researched style
            guide, comparison, or targeted research question at any point.
          </li>
          <li>
            <code>$roomfile brief</code> aligns needs, inventory, budget, and
            room truth.
          </li>
          <li>
            <code>$roomfile explore</code> creates intentionally different
            directions derived from your evidence rather than a fixed style
            catalog. You can request as many directions or rounds as the
            decision needs.
          </li>
          <li>
            <code>$roomfile refine</code> revises a selected concept while
            preserving locked facts.
          </li>
          <li>
            <code>$roomfile source</code>, <code>$roomfile place</code>, and{" "}
            <code>$roomfile audit</code> turn the idea into a checked plan.
          </li>
        </ol>
        <CodeBlock>$roomfile plan</CodeBlock>
      </section>

      <section>
        <h2>Use the Style Atlas when a label needs more depth</h2>
        <CodeBlock>{`$roomfile style MCM
$roomfile style "Compare Bauhaus and Japandi spatial logic"`}</CodeBlock>
        <p>
          Roomfile first loads the relevant quick guide and design signals. It
          reads the deeper field guide and visual records only when the question
          needs them. Unknown directions, regional variants, and current trends
          trigger sourced live research rather than a guessed nearest match.
        </p>
        <p>
          Your inspiration and reactions still lead. Atlas signals can be
          adopted, rejected, left uncertain, or overridden in{" "}
          <code>inspiration/style-context.json</code>.
        </p>
      </section>

      <section>
        <h2>Upgrade an existing project</h2>
        <CodeBlock>
          node scripts/migrate-project.mjs --project roomfile --to 0.3.0 --json
        </CodeBlock>
        <p>
          Migration adds an empty style context without changing existing
          location, profile, inspiration, product, photo, price, concept, or
          decision data. It is safe to run more than once.
        </p>
      </section>

      <section>
        <h2>Run the deterministic tools directly</h2>
        <CodeBlock>{`node scripts/validate-project.mjs --project roomfile --json
node scripts/render-layout.mjs --geometry roomfile/rooms/living-room/geometry.json --products roomfile/rooms/living-room/products.json --output layout.svg
node scripts/check-fit.mjs --geometry roomfile/rooms/living-room/geometry.json --products roomfile/rooms/living-room/products.json --json`}</CodeBlock>
        <p>
          Exit code 0 means success, 1 means validation or fit failures, and 2
          means malformed input or a filesystem failure.
        </p>
      </section>
    </DocsShell>
  );
}
