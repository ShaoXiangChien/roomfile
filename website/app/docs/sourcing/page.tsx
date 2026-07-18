import type { Metadata } from "next";
import { DocsShell, Note } from "../../components/site-chrome";

export const metadata: Metadata = { title: "Sourcing" };

export default function Sourcing() {
  return (
    <DocsShell
      eyebrow="Current product evidence"
      title="Sourcing"
      intro="A product is more than a link. Roomfile records what was verified, where it came from, and when it may have become stale."
    >
      <section>
        <h2>Project-configured regional priority</h2>
        <p>
          Roomfile follows the project region and retailer preferences. For
          example, a project configured for the United States uses this default:
        </p>
        <ol>
          <li>IKEA US and Amazon US.</li>
          <li>Target, Wayfair, Walmart, The Home Depot, and Lowe’s.</li>
          <li>Style-specific or independent retailers when primary sources cannot satisfy the role.</li>
        </ol>
        <p>
          Other regions use locally available retailers and the project’s
          currency, units, and postal-code conventions. Retailer order remains
          configurable by project and category.
        </p>
      </section>

      <section>
        <h2>IKEA verification</h2>
        <p>
          Capture the article number, product dimensions, package dimensions,
          assembly requirements, source URL, retrieval date, and ZIP-specific
          delivery or store result when accessible.
        </p>
      </section>

      <section>
        <h2>Amazon verification</h2>
        <p>
          Capture the ASIN, current seller, shipping result, manufacturer, and
          manufacturer dimensions when available. Marketplace listing
          dimensions must be cross-checked against the manufacturer or another
          reliable source before approval.
        </p>
        <Note title="Seller changes are product changes">
          <p>
            If the seller changes, dimensions conflict, delivery becomes
            ZIP-incompatible, or the price retrieval date becomes stale,
            Roomfile flags the candidate for re-verification.
          </p>
        </Note>
      </section>

      <section>
        <h2>Approval rules</h2>
        <ul>
          <li>Products without reliable width and depth cannot become approved.</li>
          <li>Major furniture categories keep at least one alternative.</li>
          <li>Price, stock, seller, shipping, and return-policy claims include a retrieval date.</li>
          <li>Archived examples never imply that their recorded prices remain current.</li>
        </ul>
        <p>
          Roomfile uses no affiliate links in v0.1.1 and never purchases,
          enters checkout, contacts a retailer, or communicates externally.
        </p>
      </section>
    </DocsShell>
  );
}
