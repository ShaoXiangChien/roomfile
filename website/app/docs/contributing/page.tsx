import type { Metadata } from "next";
import { CodeBlock, DocsShell } from "../../components/site-chrome";

export const metadata: Metadata = { title: "Contributing" };

export default function Contributing() {
  return (
    <DocsShell
      eyebrow="Open project"
      title="Contributing"
      intro="Roomfile is Apache-2.0 software. Contributions should make the workflow more truthful, portable, verifiable, or useful to renters."
    >
      <section>
        <h2>Development</h2>
        <CodeBlock>{`git clone https://github.com/ShaoXiangChien/roomfile.git
cd roomfile
npm test
cd website && npm ci && npm test`}</CodeBlock>
      </section>

      <section>
        <h2>Good contributions</h2>
        <ul>
          <li>New deterministic fit fixtures and geometry edge cases.</li>
          <li>Retailer adapters that preserve identifiers, dated evidence, and seller distinctions.</li>
          <li>Provider-neutral rendering adapters that keep private-photo consent explicit.</li>
          <li>Clearer documentation, accessibility, and non-US measurement normalization.</li>
        </ul>
      </section>

      <section>
        <h2>Issue categories</h2>
        <p>
          Use the repository templates for bugs, features, retailer failures,
          stale product data, or false fit results. A false fit report should
          include the smallest non-personal geometry and product fixture that
          reproduces the result.
        </p>
      </section>

      <section>
        <h2>Safety and privacy</h2>
        <p>
          Never commit real room photos, addresses, ZIP codes, budgets, account
          data, retailer credentials, or provider interaction IDs. Tests and
          examples must be fictional. No contribution may add purchasing,
          contractor commitments, affiliate links, or structural/electrical
          instruction.
        </p>
      </section>
    </DocsShell>
  );
}
