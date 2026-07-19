import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Japandi bedroom",
  description:
    "A fictional compact bedroom case study focused on sleep, soft texture, low visual weight, and compact storage.",
  alternates: { canonical: "/examples/japandi-bedroom" },
};

export default function JapandiBedroom() {
  return (
    <main id="main" className="mini-case">
      <header className="mini-case-hero shell">
        <div>
          <p className="eyebrow">Selected home 03 · Compact bedroom</p>
          <h1>A calmer place to sleep.</h1>
          <p className="lede">
            A narrow rental bedroom keeps its existing bed and finds quiet
            through texture, proportion, and a few carefully placed things.
          </p>
        </div>
        <dl>
          <div>
            <dt>Direction</dt>
            <dd>Japandi</dd>
          </div>
          <div>
            <dt>Keep</dt>
            <dd>Bed frame · architecture</dd>
          </div>
          <div>
            <dt>Need</dt>
            <dd>Sleep · calm · compact storage</dd>
          </div>
        </dl>
      </header>

      <section className="before-after-spread shell">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/japandi-bedroom/source-room.webp"
            alt="Plain compact rental bedroom before decorating"
          />
          <figcaption>Before · everything essential, very little ease</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/japandi-bedroom/final-room.webp"
            alt="Japandi bedroom after decorating with pale wood and linen"
          />
          <figcaption>After · softer texture, lower visual weight</figcaption>
        </figure>
      </section>

      <section className="case-notes shell">
        <p className="section-folio">01—04</p>
        <div>
          <p className="eyebrow">The conversation</p>
          <h2>Add comfort without filling every open surface.</h2>
        </div>
        <div className="case-note-grid">
          <article>
            <span>Understand</span>
            <p>
              The entry door, sliding closet, window, oak floor, and bed frame
              remain exactly where they are.
            </p>
          </article>
          <article>
            <span>Discover</span>
            <p>
              The resident responds to linen, pale timber, muted moss, handmade
              texture, and rooms with visible negative space.
            </p>
          </article>
          <article>
            <span>Iterate</span>
            <p>
              Storage becomes low and quiet; the lamp adds a warm evening pool;
              a single textile replaces a crowded gallery wall.
            </p>
          </article>
          <article>
            <span>Realize</span>
            <p>
              Freestanding ledges, a narrow bench, removable hanging methods,
              and a checked closet path keep the plan practical.
            </p>
          </article>
        </div>
      </section>

      <nav className="case-next shell" aria-label="More selected homes">
        <Link href="/examples/bauhaus-workspace">← Bauhaus workspace</Link>
        <Link href="/examples">All selected homes</Link>
        <Link href="/styles/japandi">Japandi field guide</Link>
        <Link href="/examples/apartment">Living room →</Link>
      </nav>
    </main>
  );
}
