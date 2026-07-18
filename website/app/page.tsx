import Link from "next/link";
import { CopyCommand } from "./components/copy-command";
import { RoomVisual } from "./components/room-visual";

const commands = [
  ["init", "Create a private project once."],
  ["taste", "Turn references into evidence."],
  ["capture", "Record room truth and uncertainty."],
  ["explore", "Compare three different directions."],
  ["place", "Check one product against the room."],
  ["source", "Find current, verifiable candidates."],
  ["plan", "Sequence buying and installation."],
  ["audit", "Catch gaps before money moves."],
];

export default function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">An open Agent Skill for real apartments</p>
            <h1>Your room, remembered.</h1>
            <p className="hero-lede">
              A project-based interior design skill that learns your taste,
              remembers constraints, checks fit, and turns ideas into a real
              shopping plan.
            </p>
            <CopyCommand />
            <div className="hero-actions">
              <Link className="button primary" href="/docs/getting-started">
                Start your first room
              </Link>
              <a
                className="button text-button"
                href="https://github.com/ShaoXiangChien/roomfile"
              >
                Open on GitHub <span>↗</span>
              </a>
            </div>
            <p className="microcopy">
              Tested in Codex · local files · Apache-2.0 · no affiliate links
            </p>
          </div>
          <div className="hero-visual">
            <div className="before-card">
              <RoomVisual style="source" compact />
              <span>01 · Room truth</span>
            </div>
            <div className="after-card">
              <RoomVisual style="refined" />
              <span>04 · Refined direction</span>
            </div>
            <div className="measure-tag">
              <strong>70⅞ × 23¼ in</strong>
              <span>measured separately</span>
            </div>
          </div>
        </div>
      </section>

      <section className="manifesto ruled-section">
        <div className="shell split-heading">
          <p className="eyebrow">The missing layer</p>
          <div>
            <h2>Beautiful pictures forget. Projects remember.</h2>
            <p>
              One-shot room generators optimize the next image. Roomfile keeps
              a durable record of what the room is, what you like, what must
              stay, and what has actually been verified.
            </p>
          </div>
        </div>
        <div className="shell problem-grid">
          <article>
            <span className="step-number">01</span>
            <h3>Taste before labels</h3>
            <p>
              Save links and screenshots, then record the specific wood,
              proportion, color, or feeling you reacted to—including dislikes
              and contradictions.
            </p>
          </article>
          <article>
            <span className="step-number">02</span>
            <h3>One canonical room</h3>
            <p>
              Photos, measurements, doors, windows, fixed elements, rental
              rules, and uncertainty live together. You stop re-uploading the
              same context.
            </p>
          </article>
          <article>
            <span className="step-number">03</span>
            <h3>Reality after the render</h3>
            <p>
              Products are dated, dimensioned, fit-checked, budgeted, and
              sequenced into a plan. Attractive is the start—not the finish.
            </p>
          </article>
        </div>
      </section>

      <section className="concepts section">
        <div className="shell section-heading">
          <p className="eyebrow">Three answers to the same room</p>
          <h2>Explore differences that matter.</h2>
          <p>
            The geometry, viewpoint, sofa, dining table, windows, and flooring
            stay fixed. Only the design direction changes.
          </p>
        </div>
        <div className="shell concept-grid">
          <article className="concept-card">
            <RoomVisual style="mid-century" compact />
            <p className="eyebrow">Direction 01</p>
            <h3>Mid-century Modern</h3>
            <p>Walnut, warm neutrals, tapered forms, sculptural light.</p>
            <span className="decision selected">Selected for refinement</span>
          </article>
          <article className="concept-card">
            <RoomVisual style="bauhaus" compact />
            <p className="eyebrow">Direction 02</p>
            <h3>Bauhaus</h3>
            <p>Tubular steel, primary accents, geometric functional contrast.</p>
            <span className="decision">Held as an alternative</span>
          </article>
          <article className="concept-card">
            <RoomVisual style="japandi" compact />
            <p className="eyebrow">Direction 03</p>
            <h3>Japandi</h3>
            <p>Pale timber, natural texture, low visual weight, negative space.</p>
            <span className="decision">Held as an alternative</span>
          </article>
        </div>
        <div className="shell section-link">
          <Link href="/examples/us-apartment">
            See the complete fictional US apartment workflow <span>→</span>
          </Link>
        </div>
      </section>

      <section className="fit-section section">
        <div className="shell fit-grid">
          <div className="fit-copy">
            <p className="eyebrow">Image imagination, numeric discipline</p>
            <h2>A render can suggest. Only measurements can prove.</h2>
            <p>
              Roomfile separates photorealistic exploration from a deterministic
              inch-based layout. It checks boundaries, overlaps, door swings,
              circulation zones, and clearances without asking an image model to
              guess.
            </p>
            <ul className="check-list">
              <li>Measured facts cannot be replaced by inferred ones.</li>
              <li>Rotations and edge-touching are evaluated consistently.</li>
              <li>Every render carries a visual-approximation disclaimer.</li>
            </ul>
            <Link className="inline-link" href="/docs/project-files">
              Read the geometry contract →
            </Link>
          </div>
          <div className="floor-plan" aria-label="Scaled room layout example">
            <div className="plan-label top-label">240 in</div>
            <div className="plan-label side-label">180 in</div>
            <div className="plan-room">
              <span className="plan-sofa">existing sofa</span>
              <span className="plan-coffee">coffee table</span>
              <span className="plan-dining">existing table</span>
              <span className="plan-lamp">lamp</span>
              <span className="plan-clearance">entry swing</span>
              <span className="plan-radiator">radiator clearance</span>
            </div>
            <div className="plan-result">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Fit check passed</strong>
                <small>Structured geometry, not pixels</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sourcing section">
        <div className="shell sourcing-grid">
          <div>
            <p className="eyebrow">From “where can I buy it?” to evidence</p>
            <h2>IKEA and Amazon, with receipts for every claim.</h2>
            <p>
              Roomfile records article numbers and ASINs, seller,
              manufacturer dimensions, package size, price, availability,
              ZIP-specific delivery results, and retrieval date. Changed
              sellers and stale data are flags, not footnotes.
            </p>
            <Link className="inline-link" href="/docs/sourcing">
              Read the sourcing policy →
            </Link>
          </div>
          <div className="product-stack">
            <article className="product-card approved">
              <div className="product-index">IKEA · 702.397.10</div>
              <h3>STOCKHOLM coffee table</h3>
              <dl>
                <div>
                  <dt>Measured</dt>
                  <dd>70⅞ × 23¼ × 15¾ in</dd>
                </div>
                <div>
                  <dt>Retrieved</dt>
                  <dd>2026-07-18</dd>
                </div>
              </dl>
              <span>Approved for the fictional plan</span>
            </article>
            <article className="product-card warning">
              <div className="product-index">Amazon · B0DPKTVQDF</div>
              <h3>TOLEAD media console</h3>
              <p>Unavailable; two dimension claims conflict.</p>
              <span>Rejected pending reliable evidence</span>
            </article>
          </div>
        </div>
      </section>

      <section className="privacy section">
        <div className="shell privacy-card">
          <div>
            <p className="eyebrow">Your home stays yours</p>
            <h2>A project folder, not another account.</h2>
          </div>
          <div>
            <p>
              Personal photos, ZIP codes, budgets, and decisions stay in a
              local <code>roomfile/</code> folder that private projects
              gitignore by default. Roomfile asks before sending private images
              to a new external renderer.
            </p>
            <p>
              Roomfile has no subscription. External model/API costs may
              apply, and current retailer research still requires network
              access.
            </p>
          </div>
        </div>
      </section>

      <section className="commands section">
        <div className="shell section-heading compact-heading">
          <p className="eyebrow">One umbrella skill</p>
          <h2>A command for every decision.</h2>
        </div>
        <div className="shell command-grid">
          {commands.map(([command, description]) => (
            <article key={command}>
              <code>$roomfile {command}</code>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <div className="shell section-link">
          <Link href="/docs/commands">Open the complete command reference →</Link>
        </div>
      </section>

      <section className="limitations section">
        <div className="shell limitation-grid">
          <div>
            <p className="eyebrow">Open source, honest limits</p>
            <h2>Decorating help—not professional certification.</h2>
          </div>
          <div className="limitation-list">
            <p>
              Roomfile is for reversible apartment decorating. It does not
              provide structural, electrical, code, contractor, or purchasing
              instructions.
            </p>
            <p>
              Prices, sellers, stock, shipping, and return policies change.
              Every current claim must be dated and rechecked.
            </p>
            <p>
              Codex is officially tested. Other Agent Skills environments are
              best-effort. Contributions are welcome under Apache-2.0.
            </p>
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="shell">
          <p className="eyebrow">Start with the room you already have</p>
          <h2>Remember once. Refine without starting over.</h2>
          <CopyCommand />
          <div className="hero-actions centered-actions">
            <Link className="button primary" href="/docs/getting-started">
              Read getting started
            </Link>
            <a
              className="button text-button"
              href="https://github.com/ShaoXiangChien/roomfile"
            >
              Star on GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
