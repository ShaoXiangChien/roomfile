import type { Metadata } from "next";
import { StyleGuide } from "../style-guide";
import { getPack } from "../atlas";

const pack = getPack("japandi");

export const metadata: Metadata = {
  title: "Japandi field guide",
  description:
    "A research-led guide to Japandi as a current hybrid label with distinct Japanese and Nordic antecedents.",
  alternates: { canonical: "/styles/japandi" },
  openGraph: {
    title: "Japandi · Roomfile Style Atlas",
    description: pack.summary,
  },
  twitter: {
    card: "summary_large_image",
    title: "Japandi · Roomfile Style Atlas",
    description:
      "A current hybrid label, distinct Japanese and Nordic antecedents, visual records, and sources.",
  },
};

export default function JapandiGuide() {
  return <StyleGuide id="japandi" />;
}
