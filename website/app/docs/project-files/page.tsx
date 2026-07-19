import type { Metadata } from "next";
import { CodeBlock, DocsShell, Note } from "../../components/site-chrome";

export const metadata: Metadata = { title: "Project files" };

export default function ProjectFiles() {
  return (
    <DocsShell
      eyebrow="Portable context"
      title="Project files"
      intro="Roomfile makes the project—not the chat—the durable source of truth. The format is versioned, human-editable, and portable."
    >
      <section>
        <h2>Folder contract</h2>
        <CodeBlock>{`roomfile/
├── roomfile.json
├── HOME.md
├── STYLE.md
├── INVENTORY.md
├── inspiration/
│   └── style-context.json
├── rooms/<slug>/
│   ├── geometry.json
│   ├── facts.json
│   ├── products.json
│   ├── concepts/
│   └── EXECUTION.md
└── .runtime/`}</CodeBlock>
      </section>

      <section>
        <h2>Four kinds of truth</h2>
        <div className="definition-grid">
          <div><strong>Observed</strong><p>Visible in a canonical photo or reliable document.</p></div>
          <div><strong>Measured</strong><p>Captured numerically with a stated unit and source.</p></div>
          <div><strong>Inferred</strong><p>A useful estimate that remains uncertainty, never fit proof.</p></div>
          <div><strong>Desired</strong><p>A preference, goal, or allowed change—not a current condition.</p></div>
        </div>
        <Note title="Measured means measured">
          <p>
            An inferred dimension cannot satisfy a fit-critical measured
            constraint. The validator rejects that shortcut.
          </p>
        </Note>
      </section>

      <section>
        <h2>Versioned structured data</h2>
        <ul>
          <li><code>roomfile.json</code> stores profile setup status, region, ISO currency, units, budget, and retailer strategy.</li>
          <li><code>geometry.json</code> stores inch-normalized boundaries, openings, fixed elements, clearances, and footprints.</li>
          <li><code>facts.json</code> stores classification, confidence, and source.</li>
          <li><code>concept.json</code> stores version, status, locks, allowed changes, decisions, and render history.</li>
          <li><code>products.json</code> stores dimensions, identifiers, retailer evidence, retrieval date, delivery, and status.</li>
          <li><code>render-request.json</code> is the provider-neutral image contract.</li>
          <li><code>style-context.json</code> records adopted, rejected, and uncertain Atlas signals while preserving user overrides.</li>
        </ul>
      </section>

      <section>
        <h2>Schema 0.3.0</h2>
        <p>
          Version 0.3.0 adds <code>style-context.json</code> and optional Atlas
          guidance in rendering requests. The validator still accepts 0.1.0
          and 0.2.0 projects with an upgrade warning.
        </p>
        <CodeBlock>
          node scripts/migrate-project.mjs --project roomfile --to 0.3.0 --json
        </CodeBlock>
      </section>

      <section>
        <h2>Privacy and portability</h2>
        <p>
          Private initialization adds a clearly delimited ignore block for{" "}
          <code>roomfile/</code>. It never overwrites existing projects or
          unrelated rules. Public examples must explicitly set{" "}
          <code>privacy_mode: public-demo</code> and contain no personal data.
        </p>
      </section>
    </DocsShell>
  );
}
