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
          <span className="brand-mark" aria-hidden="true">
            R
          </span>
          <span>Roomfile</span>
          <span className="version">v0.1.0</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/docs/getting-started">Docs</Link>
          <Link href="/examples/us-apartment">Example</Link>
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
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            Roomfile
          </Link>
          <p>
            Open-source, local-first interior design for real rooms and real
            constraints.
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
              <Link href="/examples/us-apartment">US apartment example</Link>
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
        <span>Roomfile never purchases or performs structural work.</span>
        <span>Visual renders are approximations, not dimensional proof.</span>
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
          <Link className="case-link" href="/examples/us-apartment">
            Fictional US apartment <span>→</span>
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
