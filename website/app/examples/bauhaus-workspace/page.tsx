import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bauhaus workspace",
  description:
    "A fictional compact workspace case study focused on reversible storage, focus, and visual energy.",
  alternates: { canonical: "/examples/bauhaus-workspace" },
};

export default function BauhausWorkspace() {
  return (
    <main id="main" className="mini-case">
      <header className="mini-case-hero shell">
        <div>
          <p className="eyebrow">Selected home 02 · Compact workspace</p>
          <h1>A small workspace with more energy.</h1>
          <p className="lede">
            One spare room, one existing desk and chair, and a need for focus
            without making permanent changes.
          </p>
        </div>
        <dl>
          <div>
            <dt>Direction</dt>
            <dd>Bauhaus</dd>
          </div>
          <div>
            <dt>Keep</dt>
            <dd>Desk · chair · architecture</dd>
          </div>
          <div>
            <dt>Need</dt>
            <dd>Focus · storage · visual energy</dd>
          </div>
        </dl>
      </header>

      <section className="before-after-spread shell">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/bauhaus-workspace/source-room.webp"
            alt="Plain compact workspace before decorating"
          />
          <figcaption>Before · the desk works, the room does not yet</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/bauhaus-workspace/final-room.webp"
            alt="Bauhaus-inspired workspace after decorating"
          />
          <figcaption>After · color becomes part of the organization</figcaption>
        </figure>
      </section>

      <section className="case-notes shell">
        <p className="section-folio">01—04</p>
        <div>
          <p className="eyebrow">The conversation</p>
          <h2>Make the room stimulating, not distracting.</h2>
        </div>
        <div className="case-note-grid">
          <article>
            <span>Understand</span>
            <p>
              The window, closet, door, oak floor, desk, and chair remain. The
              walk to the closet stays clear.
            </p>
          </article>
          <article>
            <span>Discover</span>
            <p>
              The resident reacts to tubular steel, crisp geometry, and primary
              color used with restraint.
            </p>
          </article>
          <article>
            <span>Iterate</span>
            <p>
              A blue rug defines the work zone; red storage removes desk
              clutter; yellow task light adds energy at the point of use.
            </p>
          </article>
          <article>
            <span>Realize</span>
            <p>
              Freestanding shelving and removable art keep the changes
              reversible, while measured door and closet clearances stay open.
            </p>
          </article>
        </div>
      </section>

      <nav className="case-next shell" aria-label="More selected homes">
        <Link href="/examples/apartment">← Living room</Link>
        <Link href="/examples">All selected homes</Link>
        <Link href="/styles/bauhaus">Bauhaus field guide</Link>
        <Link href="/examples/japandi-bedroom">Japandi bedroom →</Link>
      </nav>
    </main>
  );
}
