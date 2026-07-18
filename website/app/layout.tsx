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
    default: "Roomfile — Design your home, together.",
    template: "%s · Roomfile",
  },
  description:
    "An interior design skill that helps your AI understand your space, discover your taste, iterate on the design, try real furniture, and make the room happen.",
  keywords: [
    "interior design",
    "Agent Skill",
    "Codex",
    "home decorating",
    "furniture fit",
    "AI interior design",
  ],
  authors: [{ name: "Roomfile contributors" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Roomfile — Design your home, together.",
    description:
      "Understand the room. Discover your taste. Iterate on the design. Make it real.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Roomfile turning one living room into a warm, layered Mid-century Modern home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roomfile — Design your home, together.",
    description:
      "An interior design skill for the whole journey, from first photo to final placement.",
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
