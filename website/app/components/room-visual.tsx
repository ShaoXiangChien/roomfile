export type VisualStyle =
  | "source"
  | "mid-century"
  | "bauhaus"
  | "japandi"
  | "refined"
  | "placement";

const labels: Record<VisualStyle, string> = {
  source: "Original room",
  "mid-century": "Mid-century Modern",
  bauhaus: "Bauhaus",
  japandi: "Japandi",
  refined: "MCM refinement",
  placement: "Product placement",
};

const images: Record<VisualStyle, string> = {
  source: "/examples/apartment/source-room.webp",
  "mid-century": "/examples/apartment/mid-century-modern.webp",
  bauhaus: "/examples/apartment/bauhaus.webp",
  japandi: "/examples/apartment/japandi.webp",
  refined: "/examples/apartment/mid-century-modern-refined.webp",
  placement: "/examples/apartment/ikea-stockholm-placement.webp",
};

export function RoomVisual({
  style,
  compact = false,
}: {
  style: VisualStyle;
  compact?: boolean;
}) {
  return (
    <div
      className={`room-visual room-${style} has-photo ${compact ? "room-compact" : ""}`}
    >
      {/* Public demo art is already export-sized; keep static URLs portable across Sites. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="room-photo"
        src={images[style]}
        alt={`${labels[style]} view of the fictional living room`}
      />
      <span className="room-label">{labels[style]}</span>
    </div>
  );
}
