import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Selected Homes",
  description:
    "Three fictional Roomfile stories: a Mid-century Modern living room, a Bauhaus workspace, and a Japandi bedroom.",
  alternates: { canonical: "/examples" },
};

const homes = [
  {
    number: "01",
    href: "/examples/apartment",
    title: "A living room that became more itself.",
    room: "Living + dining",
    direction: "Mid-century Modern",
    summary:
      "A warm, layered room built around an existing sofa, dining table, records, books, and the way its resident actually lives.",
    image: "/examples/apartment/mid-century-modern-refined.webp",
    alt: "Warm Mid-century Modern living and dining room",
  },
  {
    number: "02",
    href: "/examples/bauhaus-workspace",
    title: "A small workspace with more energy.",
    room: "Compact workspace",
    direction: "Bauhaus",
    summary:
      "A spare room gets sharper focus, reversible storage, and a disciplined shot of primary color.",
    image: "/examples/bauhaus-workspace/final-room.webp",
    alt: "Compact Bauhaus-inspired workspace",
  },
  {
    number: "03",
    href: "/examples/japandi-bedroom",
    title: "A calmer place to sleep.",
    room: "Compact bedroom",
    direction: "Japandi",
    summary:
      "A tight bedroom keeps its existing bed and gains softer texture, compact storage, and room to breathe.",
    image: "/examples/japandi-bedroom/final-room.webp",
    alt: "Compact Japandi bedroom",
  },
] as const;

export default function ExamplesIndex() {
  return (
    <main id="main" className="examples-index">
      <header className="examples-masthead shell">
        <p className="eyebrow">Roomfile journal · Issue 02</p>
        <h1>Selected Homes</h1>
        <p>
          Three rooms, three different lives, and three conversations that
          moved from what was already there to what could happen next.
        </p>
      </header>
      <div className="shell homes-list">
        {homes.map((home) => (
          <Link className="home-entry" href={home.href} key={home.href}>
            <span className="home-number">{home.number}</span>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={home.image} alt={home.alt} />
              <figcaption>
                {home.room} · {home.direction}
              </figcaption>
            </figure>
            <div>
              <h2>{home.title}</h2>
              <p>{home.summary}</p>
              <strong>Open the story →</strong>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
