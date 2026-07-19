import atlasData from "../generated/style-atlas.json";

export type AtlasSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  tier: number;
  kind: string;
  retrieved_at: string;
  supports: string;
};

export type AtlasVisual = {
  id: string;
  source_id: string;
  public_path: string;
  source_page: string;
  creator: string;
  work_title: string;
  work_date: string;
  institution: string;
  license: string;
  license_url: string;
  attribution: string;
  alt: string;
  caption: string;
  what_to_notice: string;
  what_not_to_generalize: string;
  width: number;
  height: number;
  context: string;
};

export type AtlasPack = {
  id: string;
  name: string;
  aliases: string[];
  version: string;
  reviewed_at: string;
  summary: string;
  definition: string;
  coverage: {
    sources: number;
    visuals: number;
    reviewed_at: string;
  };
  sections: Record<string, string>;
  signals: {
    historical_core: string[];
    current_expressions: string[];
    composition: string[];
    furniture_forms: string[];
    materials: string[];
    palette: string[];
    lighting: string[];
    textiles_art: string[];
    spatial_density: string[];
    variants: string[];
    adjacent_styles: string[];
    questions: string[];
    cliches_to_avoid: string[];
  };
  sources: AtlasSource[];
  visuals: AtlasVisual[];
};

export const atlas = atlasData as {
  schema_version: string;
  generated_from: string;
  purpose: string;
  user_inspiration_priority: boolean;
  packs: AtlasPack[];
};

export const appliedExamples: Record<
  string,
  { href: string; label: string; room: string }
> = {
  "mid-century-modern": {
    href: "/examples/apartment",
    label: "See the living room story",
    room: "Living + dining",
  },
  bauhaus: {
    href: "/examples/bauhaus-workspace",
    label: "See the workspace story",
    room: "Compact workspace",
  },
  japandi: {
    href: "/examples/japandi-bedroom",
    label: "See the bedroom story",
    room: "Compact bedroom",
  },
};

export function getPack(id: string) {
  const pack = atlas.packs.find((item) => item.id === id);
  if (!pack) throw new Error(`Missing synchronized Style Atlas pack: ${id}`);
  return pack;
}
