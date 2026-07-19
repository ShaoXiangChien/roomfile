import type { Metadata } from "next";
import { StyleGuide } from "../style-guide";
import { getPack } from "../atlas";

const pack = getPack("bauhaus");

export const metadata: Metadata = {
  title: "Bauhaus field guide",
  description:
    "A research-led guide to Bauhaus pedagogy, workshops, material experiments, and responsible room translation.",
  alternates: { canonical: "/styles/bauhaus" },
  openGraph: {
    title: "Bauhaus · Roomfile Style Atlas",
    description: pack.summary,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bauhaus · Roomfile Style Atlas",
    description:
      "Pedagogy, workshops, material experiments, current translation, visual records, and sources.",
  },
};

export default function BauhausGuide() {
  return <StyleGuide id="bauhaus" />;
}
