import { RoomVisual, type VisualStyle } from "../components/room-visual";

const journey = [
  {
    number: "01 / 05",
    kicker: "The room",
    title: "Start with the life already happening here.",
    body: "One canonical view. Existing sofa and table. Protected windows, radiator, flooring, and entry path.",
    style: "source" as VisualStyle,
    footer: "Understand the room",
  },
  {
    number: "02 / 05",
    kicker: "The taste",
    title: "You do not need to know the style name.",
    body: "Amber light, walnut, olive, rust, records, books, posters, and plants become specific design evidence.",
    style: "mid-century" as VisualStyle,
    footer: "Discover what feels like you",
  },
  {
    number: "03 / 05",
    kicker: "The revisions",
    title: "Each round begins where the last one ended.",
    body: "Resident feedback makes the same Mid-century Modern room warmer, more collected, and more personal.",
    style: "refined" as VisualStyle,
    footer: "Design it together",
  },
  {
    number: "04 / 05",
    kicker: "The product trial",
    title: "See the real thing. Then check the numbers.",
    body: "The selected coffee table enters the current design; its real footprint is checked in the measured layout.",
    style: "placement" as VisualStyle,
    footer: "Try before committing",
  },
  {
    number: "05 / 05",
    kicker: "The plan",
    title: "Turn the final room into next actions.",
    body: "Products, dimensions, sources, alternatives, fit results, and phases make the design possible to execute.",
    style: "placement" as VisualStyle,
    footer: "Make it real",
  },
] as const;

const workflow = [
  {
    number: "01 / 05",
    kicker: "$roomfile capture",
    title: "Understand the room.",
    body: "Photos, measurements, openings, fixed elements, routines, and constraints become the shared starting point.",
    accent: "olive",
  },
  {
    number: "02 / 05",
    kicker: "$roomfile taste",
    title: "Discover the taste.",
    body: "Links, screenshots, likes, dislikes, and contradictions become concrete design evidence.",
    accent: "rust",
  },
  {
    number: "03 / 05",
    kicker: "$roomfile refine",
    title: "Keep the conversation moving.",
    body: "Revise the chosen direction while preserving what the room and resident have already approved.",
    accent: "paper",
  },
  {
    number: "04 / 05",
    kicker: "$roomfile place",
    title: "Try real furniture.",
    body: "Place a specific product into the current room, then check its measured footprint separately.",
    accent: "olive",
  },
  {
    number: "05 / 05",
    kicker: "$roomfile source",
    title: "Make the room happen.",
    body: "Current sources, reliable dimensions, alternatives, budget, and phases become one actionable plan.",
    accent: "rust",
  },
] as const;

export default async function LaunchKit({
  searchParams,
}: {
  searchParams: Promise<{
    deck?: string;
    slide?: string;
    format?: string;
  }>;
}) {
  const query = await searchParams;
  const slideIndex = Math.max(0, Math.min(4, Number(query.slide ?? "1") - 1));
  const format = query.format ?? "carousel";

  if (format === "og" || format === "repository" || format === "readme") {
    return <HeroAsset format={format} />;
  }

  if (query.deck === "workflow") {
    const slide = workflow[slideIndex];
    return (
      <main className={`launch-canvas launch-workflow accent-${slide.accent}`}>
        <div className="launch-topline">
          <span>Roomfile</span>
          <span>{slide.number}</span>
        </div>
        <div className="workflow-command">{slide.kicker}</div>
        <h1>{slide.title}</h1>
        <p>{slide.body}</p>
        <div className="workflow-track">
          {workflow.map((_, index) => (
            <i className={index <= slideIndex ? "active" : ""} key={index} />
          ))}
        </div>
        <div className="launch-footer">
          <code>npx skills add ShaoXiangChien/roomfile</code>
          <span>Design your home, together.</span>
        </div>
      </main>
    );
  }

  const slide = journey[slideIndex];
  return (
    <main className="launch-canvas launch-before-after">
      <div className="launch-topline">
        <span>Roomfile</span>
        <span>{slide.number}</span>
      </div>
      <div className="launch-grid">
        <div>
          <p className="launch-kicker">{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className="launch-body">{slide.body}</p>
          <div className="launch-footer-label">{slide.footer}</div>
        </div>
        <RoomVisual style={slide.style} />
      </div>
    </main>
  );
}

function HeroAsset({
  format,
}: {
  format: "og" | "repository" | "readme";
}) {
  return (
    <main className={`launch-canvas launch-hero launch-${format}`}>
      <div className="launch-brandline">
        <strong>Roomfile</strong>
        <em>v0.2.0</em>
      </div>
      <div className="launch-hero-grid">
        <div>
          <p className="launch-kicker">An interior design skill for coding agents</p>
          <h1>Design your home, together.</h1>
          <p className="launch-body">
            Understand the room. Discover your taste. Iterate on the design.
            Try real furniture. Make it happen.
          </p>
          <code>npx skills add ShaoXiangChien/roomfile</code>
        </div>
        <div className="launch-hero-rooms">
          <RoomVisual style="refined" />
          <span>From first photo to final placement</span>
        </div>
      </div>
      <div className="launch-bottomline">
        <span>One room · one evolving conversation</span>
        <span>Open source · tested in Codex</span>
      </div>
    </main>
  );
}
