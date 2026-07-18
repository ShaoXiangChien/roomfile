import Link from "next/link";

const docs = [
  ["/docs/getting-started", "Getting started"],
  ["/docs/commands", "Commands"],
  ["/docs/project-files", "Project files"],
  ["/docs/rendering", "Rendering"],
  ["/docs/sourcing", "Sourcing"],
  ["/docs/contributing", "Contributing"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Roomfile home">
          <span className="masthead">Roomfile</span>
          <span className="version">v0.2.0</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/examples">Selected Homes</Link>
          <Link href="/docs/getting-started">Docs</Link>
          <a
            href="https://github.com/ShaoXiangChien/roomfile"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="masthead">Roomfile</span>
          </Link>
          <p>
            An interior design skill that stays with you from the first photo
            to the final placement.
          </p>
        </div>
        <div>
          <p className="footer-label">Documentation</p>
          <ul>
            {docs.map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="footer-label">Project</p>
          <ul>
            <li>
              <Link href="/examples">Selected Homes</Link>
            </li>
            <li>
              <a href="https://github.com/ShaoXiangChien/roomfile">
                Source on GitHub
              </a>
            </li>
            <li>Apache-2.0</li>
          </ul>
        </div>
      </div>
      <div className="shell legal-line">
        <span>Apache-2.0 · v0.2.0</span>
        <span>
          <Link href="/docs/project-files">Privacy</Link> ·{" "}
          <Link href="/docs/rendering">Rendering notes</Link>
        </span>
      </div>
    </footer>
  );
}

export function DocsShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="docs-main">
      <div className="shell docs-layout">
        <aside className="docs-nav" aria-label="Documentation">
          <p className="eyebrow">Documentation</p>
          <ul>
            {docs.map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
          <Link className="case-link" href="/examples/apartment">
            Selected living room <span>→</span>
          </Link>
        </aside>
        <article className="docs-article">
          <header className="docs-hero">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="lede">{intro}</p>
          </header>
          {children}
        </article>
      </div>
    </main>
  );
}

export function Note({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="note">
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  return <pre className="code-block"><code>{children}</code></pre>;
}
