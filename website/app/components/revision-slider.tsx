"use client";

import { useId, useState } from "react";

const revisions = [
  {
    label: "First pass",
    image: "/examples/apartment/mid-century-modern.webp",
    note: "The warmth is right. Keep the sofa and dining table, but let the room feel more collected.",
  },
  {
    label: "Refined",
    image: "/examples/apartment/mid-century-modern-refined.webp",
    note: "More art, records, plants, and amber light—without touching the windows, radiator, or flooring.",
  },
  {
    label: "Product trial",
    image: "/examples/apartment/ikea-stockholm-placement.webp",
    note: "Try the real coffee table in the approved direction, then verify its footprint separately.",
  },
] as const;

export function RevisionSlider() {
  const [revision, setRevision] = useState(1);
  const labelId = useId();
  const current = revisions[revision];

  return (
    <div className="revision-studio">
      <div className="revision-stage" aria-live="polite">
        {revisions.map((item, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            aria-hidden={index !== revision}
            className={index === revision ? "is-active" : ""}
            key={item.image}
            src={item.image}
            alt={
              index === revision
                ? `${item.label} of the same Mid-century Modern living room`
                : ""
            }
          />
        ))}
        <div className="revision-folio">
          <span>{String(revision + 1).padStart(2, "0")}</span>
          <strong>{current.label}</strong>
        </div>
      </div>
      <div className="revision-controls">
        <div className="revision-input">
          <label id={labelId} htmlFor="revision-range">
            Move through the revisions
          </label>
          <input
            id="revision-range"
            type="range"
            min="0"
            max="2"
            step="1"
            value={revision}
            aria-labelledby={labelId}
            aria-valuetext={current.label}
            onInput={(event) => setRevision(Number(event.currentTarget.value))}
            onKeyDown={(event) => {
              if (event.key === "Home") {
                event.preventDefault();
                setRevision(0);
              } else if (event.key === "End") {
                event.preventDefault();
                setRevision(revisions.length - 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                setRevision((value) => Math.max(0, value - 1));
              } else if (
                event.key === "ArrowRight" ||
                event.key === "ArrowUp"
              ) {
                event.preventDefault();
                setRevision((value) => Math.min(revisions.length - 1, value + 1));
              }
            }}
          />
          <div aria-hidden="true" className="revision-ticks">
            {revisions.map((item, index) => (
              <span className={index === revision ? "active" : ""} key={item.label}>
                {String(index + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
        <blockquote>
          “{current.note}”
          <cite>Resident note · revision {revision + 1}</cite>
        </blockquote>
      </div>
    </div>
  );
}
