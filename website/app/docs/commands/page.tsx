import type { Metadata } from "next";
import { DocsShell } from "../../components/site-chrome";

export const metadata: Metadata = { title: "Command reference" };

const commands = [
  ["init", "Interview for location, units, budget, retailer strategy, household needs, privacy, and rendering preferences."],
  ["status", "Inspect completeness and recommend the next useful action."],
  ["taste", "Analyze links or screenshots into evidence, dislikes, anti-references, and contradictions."],
  ["capture", "Register canonical photos, measured geometry, fixed elements, lighting, circulation, and uncertainty."],
  ["brief", "Combine taste, needs, budget, inventory, and room truth into an approval-ready brief."],
  ["explore", "Create evidence-led design directions with no fixed style allowlist or preset catalog."],
  ["refine", "Revise the selected concept while preserving locked architecture, inventory, and decisions."],
  ["place", "Evaluate a product using verified dimensions, the scaled layout, and an approximate visual placement."],
  ["source", "Find current purchasable candidates with dated price, seller, dimensions, stock, and delivery evidence."],
  ["plan", "Create a phased shopping, placement, styling, assembly, budget, and installation plan."],
  ["audit", "Detect missing measurements, collisions, stale data, weak facts, and render-to-reality gaps."],
] as const;

export default function Commands() {
  return (
    <DocsShell
      eyebrow="Reference"
      title="Command reference"
      intro="Roomfile is one umbrella skill with focused commands. Calling $roomfile without a command behaves like status."
    >
      <div className="command-reference">
        {commands.map(([command, description]) => (
          <section key={command} id={command}>
            <h2>
              <code>$roomfile {command}</code>
            </h2>
            <p>{description}</p>
            {command === "refine" || command === "place" ? (
              <p className="muted">
                Requires explicit user approval before anything becomes{" "}
                <code>approved</code>.
              </p>
            ) : null}
          </section>
        ))}
      </div>
      <section>
        <h2>Boundaries</h2>
        <p>
          Commands may write inside the local project and perform read-only
          product research. Roomfile never purchases, enters checkout, creates
          affiliate redirection, contacts a seller, commits a contractor, or
          provides structural or electrical instructions.
        </p>
      </section>
    </DocsShell>
  );
}
