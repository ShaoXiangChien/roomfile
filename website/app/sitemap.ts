import type { MetadataRoute } from "next";

const routes = [
  "",
  "/docs/getting-started",
  "/docs/commands",
  "/docs/project-files",
  "/docs/rendering",
  "/docs/sourcing",
  "/examples",
  "/examples/apartment",
  "/examples/bauhaus-workspace",
  "/examples/japandi-bedroom",
  "/docs/contributing",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://roomfile-shaoxiangchien.ericchien21.chatgpt.site";
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date("2026-07-19T00:00:00Z"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
