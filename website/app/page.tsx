import Link from "next/link";
import { CopyCommand } from "./components/copy-command";
import { ProductLedger } from "./components/product-ledger";
import { RevisionSlider } from "./components/revision-slider";

const roomFacts = [
  ["Room", "Combined living + dining"],
  ["Keep", "Sofa · oak dining table"],
  ["Protect", "Windows · radiator · flooring"],
  ["Needs", "Conversation · records · dinner for four"],
] as const;

const tasteFragments = [
  {
    name: "Amber glow",
    className: "fragment-light",
    reaction: "“More pools of warm light—not one bright ceiling light.”",
  },
  {
    name: "Walnut",
    className: "fragment-walnut",
    reaction: "“Rich wood, but keep it from feeling heavy.”",
  },
  {
    name: "Olive + rust",
    className: "fragment-color",
    reaction: "“I keep saving this combination.”",
  },
  {
    name: "Collected layers",
    className: "fragment-pattern",
    reaction: "“Books, records, posters, and plants make it feel lived in.”",
  },
] as const;

export default function Home() {
  return (
    <main id="main">
      <nav className="chapter-progress" aria-label="Room journey">
        <a href="#room">01 Understand</a>
        <a href="#taste">02 Discover</a>
        <a href="#iterate">03 Iterate</a>
        <a href="#place">04 Try</a>
        <a href="#source">05 Realize</a>
      </nav>

      <section className="editorial-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-room"
          src="/examples/apartment/mid-century-modern-refined.webp"
          alt="Warm Mid-century Modern living and dining room with olive and rust rug, amber lights, walnut furniture, art, books, records, and plants"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-editorial-copy">
          <p className="eyebrow">An interior design skill for coding agents</p>
          <h1>Design your home, together.</h1>
          <p>
            Roomfile helps your AI understand the space you have, discover what
            you love, iterate on the design with you, and turn the final idea
            into a room you can actually create.
          </p>
          <div className="hero-actions">
            <a className="button light" href="#install">
              Install Roomfile
            </a>
            <a className="editorial-link light-link" href="#room">
              See a room take shape <span>↓</span>
            </a>
          </div>
        </div>
        <figure className="hero-inset">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/apartment/source-room.webp"
            alt="The same fictional room before decorating"
          />
          <figcaption>Before · the room we started with</figcaption>
        </figure>
        <p className="hero-folio">Issue 02 · A room in progress</p>
      </section>

      <div className="install-strip" id="install">
        <div className="shell install-strip-inner">
          <span>Install in one line</span>
          <CopyCommand />
          <Link href="/docs/getting-started">Getting started →</Link>
        </div>
      </div>

      <section className="journey-section meet-room" id="room">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">01</span>
            <div>
              <p className="eyebrow">Meet the room</p>
              <h2>Begin with the life already happening here.</h2>
            </div>
            <p className="margin-intro">
              The first conversation is not about a style. It is about the
              room, the routines inside it, and what cannot move.
            </p>
          </header>

          <div className="room-report">
            <figure className="room-report-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/examples/apartment/source-room.webp"
                alt="Undecorated living and dining room with an existing gray sofa and oak dining table"
              />
              <figcaption>
                Canonical view · sofa and dining table stay · radiator remains
                clear
              </figcaption>
            </figure>
            <div className="room-report-plan" aria-label="Simplified living room plan">
              <div className="plan-window one">window</div>
              <div className="plan-window two">window</div>
              <div className="plan-sofa-block">existing sofa</div>
              <div className="plan-table-block">existing table</div>
              <div className="plan-radiator-block">radiator</div>
              <div className="plan-door-swing">entry</div>
              <span className="measure-line width">20 ft</span>
              <span className="measure-line height">15 ft</span>
            </div>
            <dl className="room-fact-list">
              {roomFacts.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="journey-section taste-section" id="taste">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">02</span>
            <div>
              <p className="eyebrow">Find what feels like you</p>
              <h2>You do not need to know the style name.</h2>
            </div>
            <blockquote className="pull-quote">
              “I want it warm, expressive, and a little nostalgic—never like a
              catalog.”
            </blockquote>
          </header>
          <div className="taste-board">
            {tasteFragments.map((fragment, index) => (
              <article className={fragment.className} key={fragment.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div aria-hidden="true" />
                <h3>{fragment.name}</h3>
                <p>{fragment.reaction}</p>
              </article>
            ))}
            <aside>
              <p className="eyebrow">What the AI carries forward</p>
              <ul>
                <li>Layer light at three heights</li>
                <li>Keep the palette warm and earthy</li>
                <li>Make room for records and books</li>
                <li>Avoid sparse beige minimalism</li>
              </ul>
              <strong>Direction found: Mid-century Modern</strong>
            </aside>
          </div>
        </div>
      </section>

      <section
        className="journey-section atlas-conversation"
        id="atlas-conversation"
      >
        <div className="shell">
          <header className="atlas-conversation-heading">
            <p className="eyebrow">The research behind the conversation</p>
            <h2>
              A deeper understanding of style leads to better design decisions.
            </h2>
            <div className="atlas-conversation-intro">
              <p>
                Roomfile draws from researched field guides—history, materials,
                spatial logic, current expressions, and common
                misreadings—then interprets them through what you actually
                respond to.
              </p>
              <p>
                <strong>Your references come first.</strong> The Atlas helps the
                conversation go deeper.
              </p>
            </div>
          </header>

          <div className="atlas-conversation-spread">
            <figure className="atlas-conversation-plate">
              <div className="atlas-conversation-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/styles/mid-century-modern/m-v4-m-v4.jpg"
                  width="1600"
                  height="1074"
                  alt="Color living room with a pale floral rug, low table covered with glass paperweights, upholstered lounge chairs, a wooden rocking chair, and floor-to-ceiling bookcases"
                />
                <span className="atlas-pin pin-one" aria-hidden="true">
                  01
                </span>
                <span className="atlas-pin pin-two" aria-hidden="true">
                  02
                </span>
                <span className="atlas-pin pin-three" aria-hidden="true">
                  03
                </span>
                <span className="atlas-pin pin-four" aria-hidden="true">
                  04
                </span>
              </div>
              <figcaption>
                <span>
                  Reference plate · Miller House interior · circa 2000
                </span>
                <span>
                  Marsh Davis · Indiana Landmarks / DPLA ·{" "}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:Miller_House_interior,_c2000_(Columbus,_Ind.)_-_DPLA_-_35947909314af82961d036a37975f3fd.jpg"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source ↗
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 4.0 ↗
                  </a>
                </span>
              </figcaption>
            </figure>

            <aside className="atlas-conversation-notes">
              <dl>
                <div>
                  <dt>
                    <span>01</span> What the agent notices
                  </dt>
                  <dd>
                    Layered textiles, color, storage, and seating—not a
                    checklist of walnut legs.
                  </dd>
                </div>
                <div>
                  <dt>
                    <span>02</span> What it does not generalize
                  </dt>
                  <dd>
                    One exceptional commissioned house is not the definition of
                    every Mid-century Modern room.
                  </dd>
                </div>
                <div>
                  <dt>
                    <span>03</span> How it translates into your room
                  </dt>
                  <dd>
                    Layered lighting, warm wood, collected objects, and a
                    denser, more social layout.
                  </dd>
                </div>
                <div>
                  <dt>
                    <span>04</span> Which clichés it avoids
                  </dt>
                  <dd>
                    A token orange rug, empty staging, and furniture chosen only
                    because it has tapered legs.
                  </dd>
                </div>
              </dl>
              <Link className="editorial-link" href="/styles">
                Explore the Style Atlas <span>→</span>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="journey-section revision-section" id="iterate">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">03</span>
            <div>
              <p className="eyebrow">Design it together</p>
              <h2>Each round begins where the last one ended.</h2>
            </div>
            <p className="margin-intro">
              The room stays recognizable. Your feedback becomes the next
              revision, while approved decisions and fixed elements remain in
              place.
            </p>
          </header>
          <RevisionSlider />
        </div>
      </section>

      <section className="journey-section placement-section" id="place">
        <div className="shell placement-grid">
          <div className="placement-copy">
            <span className="section-folio">04</span>
            <p className="eyebrow">Try the real thing</p>
            <h2>See it in the room. Then check the numbers.</h2>
            <p>
              Found a table you love? Roomfile can place it into the current
              design without restarting the concept, then compare its real
              dimensions with the measured layout.
            </p>
            <div className="fit-result">
              <span>Fit result</span>
              <strong>Pass</strong>
              <dl>
                <div>
                  <dt>Footprint</dt>
                  <dd>70⅞ × 23¼ in</dd>
                </div>
                <div>
                  <dt>Walkway</dt>
                  <dd>36 in clear</dd>
                </div>
                <div>
                  <dt>Door + radiator</dt>
                  <dd>Clear</dd>
                </div>
              </dl>
            </div>
          </div>
          <figure className="placement-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/examples/apartment/ikea-stockholm-placement.webp"
              alt="The selected oval walnut coffee table tried in the Mid-century Modern living room"
            />
            <div className="placement-callout">
              <span>Product trial</span>
              <strong>STOCKHOLM coffee table</strong>
              <small>Visual placement + separate scaled fit check</small>
            </div>
          </figure>
        </div>
      </section>

      <section className="journey-section sourcing-ledger" id="source">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">05</span>
            <div>
              <p className="eyebrow">Make it real</p>
              <h2>The final room becomes a list you can act on.</h2>
            </div>
            <p className="margin-intro">
              Each number connects the picture to a product, its real size,
              where it was found, and the decision still needed.
            </p>
          </header>
          <ProductLedger />
        </div>
      </section>

      <section className="journey-section more-homes">
        <div className="shell">
          <header className="editorial-heading">
            <span className="section-folio">06</span>
            <div>
              <p className="eyebrow">More rooms in progress</p>
              <h2>Every home begins with a different conversation.</h2>
            </div>
          </header>
          <div className="story-index">
            <Link href="/examples/bauhaus-workspace" className="story-link">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/examples/bauhaus-workspace/final-room.webp"
                  alt="Compact Bauhaus-inspired workspace with primary-color accents"
                />
                <figcaption>Workspace · Bauhaus</figcaption>
              </figure>
              <div>
                <span>Selected home 02</span>
                <h3>A small workspace with more energy.</h3>
                <p>Focus, reversible storage, and a disciplined use of color.</p>
                <strong>Read the story →</strong>
              </div>
            </Link>
            <Link href="/examples/japandi-bedroom" className="story-link">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/examples/japandi-bedroom/final-room.webp"
                  alt="Compact Japandi bedroom with pale wood, linen, and quiet storage"
                />
                <figcaption>Bedroom · Japandi</figcaption>
              </figure>
              <div>
                <span>Selected home 03</span>
                <h3>A calmer place to sleep.</h3>
                <p>Soft texture, compact storage, and room to visually breathe.</p>
                <strong>Read the story →</strong>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="editorial-closing">
        <div className="shell">
          <p className="eyebrow">Bring Roomfile into the conversation</p>
          <h2>Your home will change. The conversation can keep up.</h2>
          <CopyCommand />
          <div className="hero-actions">
            <Link className="button dark" href="/docs/getting-started">
              Start your first room
            </Link>
            <a
              className="editorial-link"
              href="https://github.com/ShaoXiangChien/roomfile"
            >
              View Roomfile on GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
