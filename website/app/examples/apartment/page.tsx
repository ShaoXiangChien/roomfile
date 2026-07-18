import type { Metadata } from "next";
import Link from "next/link";
import { RoomVisual } from "../../components/room-visual";

export const metadata: Metadata = {
  title: "Fictional apartment example",
  description:
    "A complete Roomfile workflow for a fictional apartment, from room truth to a verified decorating plan.",
  alternates: { canonical: "/examples/apartment" },
};

export default function ApartmentExample() {
  return (
    <main id="main" className="case-study">
      <header className="case-hero">
        <div className="shell">
          <p className="eyebrow">Public demo · entirely fictional</p>
          <h1>A fictional apartment, remembered from first photo to final plan.</h1>
          <p className="lede">
            650 sq ft · combined living/dining room · $3,000 USD · existing
            sofa and dining table · reversible changes only
          </p>
          <div className="case-facts">
            <span>20 × 15 ft room</span>
            <span>ZIP 00000 (fictional)</span>
            <span>IKEA + Amazon first</span>
            <span>Retrieved 2026-07-18</span>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="shell case-step">
          <aside>
            <span>01</span>
            <p className="eyebrow">Capture</p>
          </aside>
          <div>
            <h2>Lock the room before imagining around it.</h2>
            <p>
              The same camera, two north windows, radiator, HVAC register,
              entry swing, floor, outlets, sofa, and oak dining table
              remain fixed across every concept.
            </p>
            <RoomVisual style="source" />
            <p className="image-caption">
              Fictional phone-camera source view. The public demo contains no
              personal data or real address.
            </p>
          </div>
        </div>
      </section>

      <section className="section case-taste">
        <div className="shell case-step">
          <aside>
            <span>02</span>
            <p className="eyebrow">Taste</p>
          </aside>
          <div>
            <h2>Extract the reaction, not just the style name.</h2>
            <div className="reaction-grid">
              <blockquote>
                “I like the amber light and the room feels collected.”
                <cite>→ layered lamps + personal objects, not a showroom</cite>
              </blockquote>
              <blockquote>
                “The walnut, olive, rust, and cream feel rich together.”
                <cite>→ a warm 1970s-inflected palette</cite>
              </blockquote>
              <blockquote>
                “The rug, posters, records, books, and plants give it life.”
                <cite>→ tactile, graphic, culturally specific layers</cite>
              </blockquote>
              <blockquote>
                “I don’t want sparse beige or a generic catalog room.”
                <cite>→ anti-reference: sterile minimalism</cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell case-step">
          <aside>
            <span>03</span>
            <p className="eyebrow">Explore</p>
          </aside>
          <div>
            <h2>Three example directions—not one layout in three colors.</h2>
            <div className="case-concepts">
              <article>
                <RoomVisual style="mid-century" compact />
                <h3>Eclectic Mid-century Modern</h3>
                <p>Amber light, walnut, olive, rust, tactile layers, collected objects.</p>
                <strong>Selected</strong>
              </article>
              <article>
                <RoomVisual style="bauhaus" compact />
                <h3>Bauhaus</h3>
                <p>Tubular steel, red, cobalt, yellow, black.</p>
                <span>Alternative</span>
              </article>
              <article>
                <RoomVisual style="japandi" compact />
                <h3>Japandi</h3>
                <p>Pale timber, flax, stone, quiet space.</p>
                <span>Alternative</span>
              </article>
            </div>
            <p className="image-caption">
              These are examples, not presets. Roomfile can derive any style
              direction from your own evidence. Visual approximations still
              require separate verification.
            </p>
          </div>
        </div>
      </section>

      <section className="section case-fit">
        <div className="shell case-step">
          <aside>
            <span>04</span>
            <p className="eyebrow">Fit</p>
          </aside>
          <div>
            <h2>Check the selected direction in inches.</h2>
            <RoomVisual style="refined" />
            <p className="image-caption">
              Fictional resident-approved refinement. Visual approximation;
              structured geometry remains authoritative. The selected
              Eclectic Mid-century Modern direction layers reversible
              lighting, textiles, art, books, records, and plants.
            </p>
            <div className="case-fit-grid">
              <div className="floor-plan">
                <div className="plan-label top-label">240 in</div>
                <div className="plan-label side-label">180 in</div>
                <div className="plan-room">
                  <span className="plan-sofa">84 × 36 sofa</span>
                  <span className="plan-coffee">70⅞ × 23¼ table</span>
                  <span className="plan-dining">60 × 36 dining</span>
                  <span className="plan-lamp">24 in lamp</span>
                  <span className="plan-clearance">door swing</span>
                  <span className="plan-radiator">radiator</span>
                </div>
              </div>
              <div className="fit-matrix">
                <div><span>Boundary overflow</span><strong>Pass</strong></div>
                <div><span>Product overlap</span><strong>Pass</strong></div>
                <div><span>Entry swing</span><strong>Pass</strong></div>
                <div><span>Radiator service</span><strong>Pass</strong></div>
                <div><span>Visual placement</span><em>Approximation</em></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell case-step">
          <aside>
            <span>05</span>
            <p className="eyebrow">Source</p>
          </aside>
          <div>
            <h2>Keep evidence beside every shopping decision.</h2>
            <RoomVisual style="placement" />
            <p className="image-caption">
              Approximate IKEA STOCKHOLM placement generated from the refined
              concept. The fit result below comes from dimensions, not pixels.
            </p>
            <div className="source-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Identifier</th>
                    <th>Archived price</th>
                    <th>Evidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>STOCKHOLM coffee table</td>
                    <td>IKEA 702.397.10</td>
                    <td>$449.99</td>
                    <td>Product + package dimensions</td>
                    <td><strong>Approved</strong></td>
                  </tr>
                  <tr>
                    <td>LAUTERS floor lamp</td>
                    <td>IKEA 004.050.48</td>
                    <td>$79.99</td>
                    <td>Dimensions + assembly</td>
                    <td><strong>Approved</strong></td>
                  </tr>
                  <tr>
                    <td>TOLEAD media console</td>
                    <td>Amazon B0DPKTVQDF</td>
                    <td>Unavailable</td>
                    <td>Conflicting dimensions</td>
                    <td><em>Rejected</em></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="image-caption">
              Prices are archival examples retrieved 2026-07-18, not current
              offers. ZIP 00000 is fictional, so delivery remains unverified.
            </p>
          </div>
        </div>
      </section>

      <section className="section case-plan">
        <div className="shell case-step">
          <aside>
            <span>06</span>
            <p className="eyebrow">Plan</p>
          </aside>
          <div>
            <h2>Buy in phases and preserve a reserve.</h2>
            <div className="phase-list">
              <div><span>Phase 1</span><strong>Re-measure + tape footprints</strong><em>$0</em></div>
              <div><span>Phase 2</span><strong>Lighting + coffee table</strong><em>$529.98</em></div>
              <div><span>Phase 3</span><strong>Art, textiles, plants</strong><em>$350 allowance</em></div>
              <div><span>Reserve</span><strong>Tax, delivery, returns, surprises</strong><em>$450 protected</em></div>
            </div>
            <p>
              Recheck article numbers, ASINs, sellers, return policies, current
              prices, package dimensions, and real ZIP delivery before any
              purchase. Roomfile never purchases.
            </p>
          </div>
        </div>
      </section>

      <section className="case-cta">
        <div className="shell">
          <p className="eyebrow">Inspect the project</p>
          <h2>Every claim in this case study has a file behind it.</h2>
          <div className="hero-actions centered-actions">
            <a
              className="button primary"
              href="https://github.com/ShaoXiangChien/roomfile/tree/main/examples/us-apartment"
            >
              Open example on GitHub ↗
            </a>
            <Link className="button text-button" href="/docs/getting-started">
              Start your own room →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
