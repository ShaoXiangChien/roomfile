export type VisualStyle =
  | "source"
  | "mid-century"
  | "bauhaus"
  | "japandi"
  | "refined"
  | "placement";

const labels: Record<VisualStyle, string> = {
  source: "Original room",
  "mid-century": "Eclectic Mid-century Modern",
  bauhaus: "Bauhaus",
  japandi: "Japandi",
  refined: "Approved refinement",
  placement: "IKEA product placement",
};

const images: Record<VisualStyle, string> = {
  source: "/examples/us-apartment/source-room.png",
  "mid-century": "/examples/us-apartment/mid-century-modern.png",
  bauhaus: "/examples/us-apartment/bauhaus.png",
  japandi: "/examples/us-apartment/japandi.png",
  refined: "/examples/us-apartment/mid-century-modern-refined.png",
  placement: "/examples/us-apartment/ikea-stockholm-placement.png",
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
        alt={`${labels[style]} visual approximation of the same fictional apartment room`}
      />
      <span className="room-label">{labels[style]}</span>
    </div>
  );
}
