import type { Metadata } from "next";
import Link from "next/link";
import { atlas, getPack } from "./atlas";

export const metadata: Metadata = {
  title: "Roomfile Style Atlas",
  description:
    "Research-led field guides Roomfile uses to ask sharper interior-design questions while your own references remain the source of truth.",
  alternates: { canonical: "/styles" },
  openGraph: {
    title: "Roomfile Style Atlas",
    description:
      "Field guides for richer design conversations—not presets or a selection menu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roomfile Style Atlas",
    description:
      "Research-led field guides for sharper interior-design conversations.",
  },
};

const sequence = [
  {
    id: "mid-century-modern",
    number: "01",
    question: "Which postwar ideas still feel alive in the rooms people collect now?",
  },
  {
    id: "bauhaus",
    number: "02",
    question: "What changes when Bauhaus begins with making, teaching, and use?",
  },
  {
    id: "japandi",
    number: "03",
    question: "How can a current hybrid label keep its antecedents distinct?",
  },
] as const;

export default function StylesIndex() {
  return (
    <main id="main" className="atlas-index">
      <header className="atlas-index-hero shell">
        <p className="eyebrow">Research notes · release {atlas.schema_version}</p>
        <h1>Roomfile Style Atlas</h1>
        <div className="atlas-index-intro">
          <p>
            The first field guides Roomfile uses for better design
            conversations—built to sharpen what the agent notices, not decide
            what your home should become.
          </p>
          <p>
            Start with the room and your reactions. The research helps name
            relationships, test assumptions, and ask the next useful question.
            It never narrows the directions your room can take.
          </p>
        </div>
      </header>

      <div className="atlas-reading-list shell">
        {sequence.map((story, index) => {
          const pack = getPack(story.id);
          const plate = pack.visuals[index === 0 ? 0 : index === 1 ? 4 : 1];
          return (
            <article
              className={`atlas-reading-entry atlas-reading-${index + 1}`}
              key={pack.id}
            >
              <span className="atlas-entry-folio">{story.number}</span>
              <figure
                className="atlas-entry-plate"
                data-visual-id={plate.id}
              >
                <Link href={`/styles/${pack.id}`} className="atlas-entry-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={plate.public_path}
                    alt={plate.alt}
                    width={plate.width}
                    height={plate.height}
                  />
                </Link>
                <figcaption className="atlas-entry-credit">
                  <p>{plate.caption}</p>
                  <p>
                    <span>{plate.creator}</span>
                    <span>{plate.institution}</span>
                  </p>
                  <p>
                    <a href={plate.source_page}>Source ↗</a>
                    <a href={plate.license_url}>{plate.license} ↗</a>
                  </p>
                </figcaption>
              </figure>
              <div className="atlas-entry-copy">
                <p className="eyebrow">
                  Field guide · {pack.coverage.sources} sources ·{" "}
                  {pack.coverage.visuals} plates
                </p>
                <h2>
                  <Link href={`/styles/${pack.id}`}>{pack.name}</Link>
                </h2>
                <blockquote>“{story.question}”</blockquote>
                <p>{pack.summary}</p>
                <Link className="editorial-link" href={`/styles/${pack.id}`}>
                  Read the field guide <span>→</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="atlas-index-note shell">
        <span>Three starting points, not three boundaries.</span>
        <p>
          Roomfile can research any direction. These first guides establish the
          depth, provenance, and contributor standard for what comes next.
        </p>
        <Link href="/docs/contributing">Contribute a field guide →</Link>
      </footer>
    </main>
  );
}
