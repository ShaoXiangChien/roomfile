import type { Metadata } from "next";
import Link from "next/link";
import { ProductLedger } from "../../components/product-ledger";
import { RevisionSlider } from "../../components/revision-slider";

export const metadata: Metadata = {
  title: "Mid-century Modern living room",
  description:
    "A complete fictional Roomfile story, from an existing living room and taste reactions to revisions, product placement, fit, and sourcing.",
  alternates: { canonical: "/examples/apartment" },
};

export default function ApartmentExample() {
  return (
    <main id="main" className="case-study">
      <header className="case-editorial-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/examples/apartment/mid-century-modern-refined.webp"
          alt="Finished warm Mid-century Modern living and dining room"
        />
        <div className="case-editorial-title shell">
          <p className="eyebrow">Selected home 01 · Living + dining</p>
          <h1>A living room that became more itself.</h1>
          <p>
            Mid-century Modern, found through amber light, walnut, olive, rust,
            records, books, posters, plants, and a clear dislike of anything too
            sparse.
          </p>
        </div>
      </header>

      <section className="case-opening shell">
        <p className="section-folio">01</p>
        <div>
          <p className="eyebrow">The starting point</p>
          <h2>The room was not empty. It was unfinished.</h2>
        </div>
        <div>
          <p>
            The gray sofa and oak dining table already worked. Two windows,
            radiator access, the entry path, flooring, and rental-safe changes
            defined what the design had to respect.
          </p>
          <dl>
            <div>
              <dt>Keep</dt>
              <dd>Sofa · dining table</dd>
            </div>
            <div>
              <dt>Make room for</dt>
              <dd>Conversation · records · dinner for four</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="case-before shell">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/apartment/source-room.webp"
            alt="Living and dining room before decoration"
          />
          <figcaption>Before · one canonical view for every later round</figcaption>
        </figure>
        <blockquote>
          “I want it to feel warm and collected. I like rooms where records,
          posters, books, and plants actually belong to someone.”
          <cite>The taste brief</cite>
        </blockquote>
      </section>

      <section className="case-revisions">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">02</span>
            <div>
              <p className="eyebrow">The revisions</p>
              <h2>One direction, made more specific together.</h2>
            </div>
            <p className="margin-intro">
              Move the control to see how resident feedback changed the same
              Mid-century Modern room.
            </p>
          </header>
          <RevisionSlider />
        </div>
      </section>

      <section className="case-decision shell">
        <p className="section-folio">03</p>
        <div>
          <p className="eyebrow">The product trial</p>
          <h2>Could the oval walnut table actually work?</h2>
        </div>
        <div className="decision-result">
          <strong>Yes—with a 36-inch clear route.</strong>
          <p>
            The placement image made the idea easy to judge. A separate scaled
            check handled the claim: no boundary overflow, overlap, blocked
            entry, or radiator conflict.
          </p>
          <dl>
            <div>
              <dt>Product</dt>
              <dd>IKEA STOCKHOLM · 702.397.10</dd>
            </div>
            <div>
              <dt>Footprint</dt>
              <dd>70⅞ × 23¼ in</dd>
            </div>
            <div>
              <dt>Fit</dt>
              <dd>Passed</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="case-ledger">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">04</span>
            <div>
              <p className="eyebrow">The path to the real room</p>
              <h2>Every visible decision gets a next action.</h2>
            </div>
          </header>
          <ProductLedger />
        </div>
      </section>

      <section className="case-phases shell">
        <p className="section-folio">05</p>
        <div>
          <p className="eyebrow">The sequence</p>
          <h2>Build the room in a useful order.</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <strong>Re-measure and tape the main footprints</strong>
            <em>Before ordering</em>
          </li>
          <li>
            <span>02</span>
            <strong>Resolve lighting and the coffee table</strong>
            <em>Changes how the room is used</em>
          </li>
          <li>
            <span>03</span>
            <strong>Add storage, rug, and art in layers</strong>
            <em>Review the room between rounds</em>
          </li>
          <li>
            <span>04</span>
            <strong>Style with books, records, and plants already owned</strong>
            <em>Personal before decorative</em>
          </li>
        </ol>
      </section>

      <nav className="case-next shell" aria-label="More selected homes">
        <Link href="/examples/japandi-bedroom">← Japandi bedroom</Link>
        <Link href="/examples">All selected homes</Link>
        <Link href="/styles/mid-century-modern">MCM field guide</Link>
        <Link href="/examples/bauhaus-workspace">Bauhaus workspace →</Link>
      </nav>
    </main>
  );
}
