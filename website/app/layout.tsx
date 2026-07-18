import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { SiteFooter, SiteHeader } from "./components/site-chrome";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://roomfile-shaoxiangchien.ericchien21.chatgpt.site",
  ),
  title: {
    default: "Roomfile — Your room, remembered.",
    template: "%s · Roomfile",
  },
  description:
    "A project-based interior design skill that learns your taste, remembers constraints, checks fit, and turns ideas into a real shopping plan.",
  keywords: [
    "interior design",
    "Agent Skill",
    "Codex",
    "apartment decorating",
    "furniture fit",
    "IKEA",
    "Amazon",
  ],
  authors: [{ name: "Roomfile contributors" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Roomfile — Your room, remembered.",
    description:
      "Taste, room truth, fit checks, current sourcing, and a plan you can execute.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Roomfile concept comparison for a fictional apartment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roomfile — Your room, remembered.",
    description:
      "An open-source interior design skill that remembers constraints and checks fit.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
