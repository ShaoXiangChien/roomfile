import { RoomVisual, type VisualStyle } from "../components/room-visual";

const beforeAfter = [
  {
    number: "01 / 05",
    kicker: "The room",
    title: "Start with what cannot move.",
    body: "One canonical view. Measured boundaries. Protected windows, radiator, flooring, entry swing, sofa, and dining table.",
    style: "source" as VisualStyle,
    footer: "Capture once · reuse every round",
  },
  {
    number: "02 / 05",
    kicker: "The taste",
    title: "A reaction is better than a label.",
    body: "Amber light. Walnut. Olive and rust. Tactile layers. Records, books, posters, and plants become specific evidence.",
    style: "source" as VisualStyle,
    footer: "Likes · dislikes · contradictions",
  },
  {
    number: "03 / 05",
    kicker: "The exploration",
    title: "Three genuinely different answers.",
    body: "Eclectic Mid-century Modern, Bauhaus, and Japandi show three possibilities. They are examples, not presets.",
    style: "bauhaus" as VisualStyle,
    footer: "Same geometry · different composition",
  },
  {
    number: "04 / 05",
    kicker: "The proof",
    title: "The render suggests. Inches decide.",
    body: "Furniture footprints are checked against boundaries, overlaps, the entry swing, radiator service, and circulation.",
    style: "mid-century" as VisualStyle,
    footer: "Deterministic fit · visual approximation",
  },
  {
    number: "05 / 05",
    kicker: "The plan",
    title: "Turn the picture into a real room.",
    body: "Dated regional retailer evidence becomes a phased shopping, assembly, placement, styling, and reserve plan.",
    style: "mid-century" as VisualStyle,
    footer: "Roomfile · open source · no subscription",
  },
] as const;

const workflow = [
  {
    number: "01 / 05",
    kicker: "$roomfile capture",
    title: "Remember the room.",
    body: "Canonical photos, measured geometry, openings, fixed elements, rental constraints, and uncertainty live together.",
    accent: "moss",
  },
  {
    number: "02 / 05",
    kicker: "$roomfile taste",
    title: "Learn the taste.",
    body: "Links and screenshots become specific likes, dislikes, anti-references, and productive contradictions.",
    accent: "clay",
  },
  {
    number: "03 / 05",
    kicker: "$roomfile explore",
    title: "Compare real alternatives.",
    body: "Three directions resolve the same room truth and style evidence in deliberately different ways.",
    accent: "brass",
  },
  {
    number: "04 / 05",
    kicker: "$roomfile place",
    title: "Prove fit separately.",
    body: "The scaled layout checks dimensions and clearances without asking an image model to guess.",
    accent: "moss",
  },
  {
    number: "05 / 05",
    kicker: "$roomfile plan",
    title: "Make it executable.",
    body: "Current product evidence, alternatives, budget reserve, assembly, placement, and styling become one phased plan.",
    accent: "clay",
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
          <span>Your room, remembered.</span>
        </div>
      </main>
    );
  }

  const slide = beforeAfter[slideIndex];
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
        {slideIndex === 2 ? (
          <div className="launch-three-rooms">
            <RoomVisual style="mid-century" compact />
            <RoomVisual style="bauhaus" compact />
            <RoomVisual style="japandi" compact />
          </div>
        ) : slideIndex === 3 ? (
          <div className="launch-fit-card">
            <RoomVisual style={slide.style} compact />
            <div className="mini-plan">
              <span className="mini-sofa" />
              <span className="mini-table" />
              <span className="mini-dining" />
              <strong>FIT ✓</strong>
            </div>
          </div>
        ) : (
          <RoomVisual style={slide.style} />
        )}
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
        <span className="launch-r">R</span>
        <strong>Roomfile</strong>
        <em>v0.1.1</em>
      </div>
      <div className="launch-hero-grid">
        <div>
          <p className="launch-kicker">An open Agent Skill for any room</p>
          <h1>Your room, remembered.</h1>
          <p className="launch-body">
            Taste. Room truth. Fit checks. Current sourcing. One plan you can
            actually execute.
          </p>
          <code>npx skills add ShaoXiangChien/roomfile</code>
        </div>
        <div className="launch-hero-rooms">
          <RoomVisual style="source" compact />
          <RoomVisual style="mid-century" compact />
          <span>visual approximation</span>
        </div>
      </div>
      <div className="launch-bottomline">
        <span>Any style · examples, not presets</span>
        <span>Regional sourcing · deterministic fit</span>
      </div>
    </main>
  );
}
