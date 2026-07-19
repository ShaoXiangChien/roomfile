import type { Metadata } from "next";
import { StyleGuide } from "../style-guide";
import { getPack } from "../atlas";

const pack = getPack("mid-century-modern");

export const metadata: Metadata = {
  title: "Mid-century Modern field guide",
  description:
    "A research-led guide to postwar modernisms and today’s warmer, collected MCM expressions.",
  alternates: { canonical: "/styles/mid-century-modern" },
  openGraph: {
    title: "Mid-century Modern · Roomfile Style Atlas",
    description: pack.summary,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mid-century Modern · Roomfile Style Atlas",
    description:
      "Postwar design logic, current collected expressions, misreadings, visual records, and sources.",
  },
};

export default function MidCenturyModernGuide() {
  return <StyleGuide id="mid-century-modern" />;
}
