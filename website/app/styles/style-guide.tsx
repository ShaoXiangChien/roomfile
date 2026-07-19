import Link from "next/link";
import {
  appliedExamples,
  getPack,
  type AtlasPack,
  type AtlasSource,
} from "./atlas";

const sourceGroups = [
  [1, "Tier 1 · museums, archives, and original records"],
  [2, "Tier 2 · scholarship and current practice"],
  [3, "Tier 3 · critical readings"],
] as const;

export function StyleGuide({ id }: { id: string }) {
  const pack = getPack(id);
  const example = appliedExamples[id];
  const definition = paragraphs(pack.definition);
  const misreadings = paragraphs(pack.sections.misreadings);
  const roomTranslation = paragraphs(pack.sections.room_translation);

  return (
    <main id="main" className={`atlas-guide atlas-${id}`}>
      <header className="atlas-guide-hero shell">
        <p className="eyebrow">Roomfile Style Atlas · field guide</p>
        <h1>{pack.name}</h1>
        <div className="atlas-guide-deck">
          <div className="atlas-definition">
            {definition.map((paragraph) => (
              <p key={paragraph}>{plainMarkdown(paragraph)}</p>
            ))}
          </div>
          <dl className="atlas-coverage">
            <div>
              <dt>Aliases</dt>
              <dd>{pack.aliases.join(" · ")}</dd>
            </div>
            <div>
              <dt>Pack</dt>
              <dd>v{pack.version}</dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>
                {pack.coverage.sources} sources · {pack.coverage.visuals} visual
                records
              </dd>
            </div>
            <div>
              <dt>Reviewed</dt>
              <dd>{pack.reviewed_at}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="atlas-core shell">
        <span className="section-folio">01</span>
        <div>
          <p className="eyebrow">Historical core</p>
          <h2>Begin with the design logic, not the shorthand.</h2>
        </div>
        <SectionText text={pack.sections.origins} />
        <div className="atlas-signal-ledger">
          {pack.signals.historical_core.map((signal, index) => (
            <p key={signal}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {signal}
            </p>
          ))}
        </div>
      </section>

      <section className="atlas-current">
        <div className="shell atlas-current-grid">
          <span className="section-folio">02</span>
          <div>
            <p className="eyebrow">Current expressions</p>
            <h2>See what the name is doing now.</h2>
          </div>
          <SectionText text={pack.sections.current_expressions} />
          <ul>
            {pack.signals.current_expressions.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="atlas-plates shell">
        <header className="atlas-section-heading">
          <span className="section-folio">03</span>
          <div>
            <p className="eyebrow">Annotated plates</p>
            <h2>Look slowly. Keep the context attached.</h2>
          </div>
          <p>
            Each plate is evidence for a particular relationship. Its creator,
            institution, source, license, and warning travel with the image.
          </p>
        </header>
        <div className="atlas-plate-sequence">
          {pack.visuals.map((visual, index) => (
            <figure className="atlas-plate" key={visual.id}>
              <div className="atlas-plate-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={visual.public_path}
                  alt={visual.alt}
                  width={visual.width}
                  height={visual.height}
                  loading={index > 1 ? "lazy" : "eager"}
                />
                <span>{visual.id}</span>
              </div>
              <figcaption>
                <div className="atlas-plate-title">
                  <strong>{visual.work_title}</strong>
                  <span>{visual.work_date}</span>
                </div>
                <p>{visual.caption}</p>
                <dl>
                  <div>
                    <dt>What to notice</dt>
                    <dd>{visual.what_to_notice}</dd>
                  </div>
                  <div>
                    <dt>Do not generalize</dt>
                    <dd>{visual.what_not_to_generalize}</dd>
                  </div>
                </dl>
                <p className="atlas-credit">
                  {visual.creator} · {visual.institution} ·{" "}
                  <a href={visual.source_page}>Source ↗</a> ·{" "}
                  <a href={visual.license_url}>{visual.license} ↗</a>
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="atlas-misreadings">
        <div className="shell atlas-misreadings-grid">
          <span className="section-folio">04</span>
          <div>
            <p className="eyebrow">Common misreadings</p>
            <h2>A familiar look can still flatten the story.</h2>
          </div>
          <div className="atlas-longform">
            {misreadings.map((paragraph) => (
              <p key={paragraph}>{plainMarkdown(paragraph)}</p>
            ))}
          </div>
          <ol>
            {pack.signals.cliches_to_avoid.map((cliche, index) => (
              <li key={cliche}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {cliche}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="atlas-translation shell">
        <span className="section-folio">05</span>
        <div>
          <p className="eyebrow">Room translation</p>
          <h2>Bring the research back to this room.</h2>
          <div className="atlas-longform">
            {roomTranslation.map((paragraph) => (
              <p key={paragraph}>{plainMarkdown(paragraph)}</p>
            ))}
          </div>
        </div>
        <TranslationLedger pack={pack} />
        <aside className="atlas-questions">
          <p className="eyebrow">Questions for the room</p>
          <ol>
            {pack.signals.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="atlas-applied">
        <div className="shell">
          <p className="eyebrow">Applied, not prescribed</p>
          <p className="atlas-applied-room">{example.room}</p>
          <h2>See where research met one resident’s actual constraints.</h2>
          <Link className="button light" href={example.href}>
            {example.label}
          </Link>
        </div>
      </section>

      <section className="atlas-sources shell">
        <header className="atlas-section-heading">
          <span className="section-folio">06</span>
          <div>
            <p className="eyebrow">Sources</p>
            <h2>Follow the evidence further.</h2>
          </div>
          <p>
            Release snapshot reviewed {pack.reviewed_at}. Source links support
            research; image reuse follows the license shown beside each plate.
          </p>
        </header>
        {sourceGroups.map(([tier, heading]) => {
          const sources = pack.sources.filter((source) => source.tier === tier);
          return (
            <section className="atlas-source-group" key={tier}>
              <h3>{heading}</h3>
              <ol>
                {sources.map((source) => (
                  <SourceRecord source={source} key={source.id} />
                ))}
              </ol>
            </section>
          );
        })}
      </section>

      <nav className="atlas-guide-next shell" aria-label="Style Atlas">
        <Link href="/styles">← All field guides</Link>
        <Link href="/docs/commands#style">Use $roomfile style →</Link>
      </nav>
    </main>
  );
}

function SectionText({ text }: { text: string }) {
  return (
    <div className="atlas-longform">
      {paragraphs(text).map((paragraph) => (
        <p key={paragraph}>{plainMarkdown(paragraph)}</p>
      ))}
    </div>
  );
}

function TranslationLedger({ pack }: { pack: AtlasPack }) {
  const rows = [
    ["Composition", pack.signals.composition],
    ["Furniture", pack.signals.furniture_forms],
    ["Materials", pack.signals.materials],
    ["Palette", pack.signals.palette],
    ["Lighting", pack.signals.lighting],
    ["Textiles + art", pack.signals.textiles_art],
    ["Density", pack.signals.spatial_density],
  ] as const;
  return (
    <dl className="atlas-translation-ledger">
      {rows.map(([label, values]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{values.join(" ")}</dd>
        </div>
      ))}
    </dl>
  );
}

function SourceRecord({ source }: { source: AtlasSource }) {
  return (
    <li id={`source-${source.id}`}>
      <span>{source.id}</span>
      <div>
        <h4>
          <a href={source.url}>{source.title} ↗</a>
        </h4>
        <p>
          {source.publisher} · {source.kind} · retrieved {source.retrieved_at}
        </p>
        <p>{source.supports}</p>
      </div>
    </li>
  );
}

function paragraphs(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .map((value) => value.replaceAll(/\s+/g, " ").trim())
    .filter(Boolean);
}

function plainMarkdown(value: string) {
  return value.replaceAll(/[*_`]/g, "");
}
