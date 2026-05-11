import { useEffect, useState } from "react"
import { fetchJson, type PaginatedPublications, type Publication } from "@/lib/api"

const T = {
  "surface-dark": "#005357",
  "surface-dark-elevated": "#003d40",
  "on-dark": "#faf9f5",
  "on-dark-soft": "rgba(250,249,245,0.7)",
  hairline: "rgba(250,249,245,0.12)",
  primary: "#005357",
}

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear()
  const [pubs, setPubs] = useState<Publication[]>([])

  useEffect(() => {
    fetchJson<PaginatedPublications>("/api/publications/?limit=4")
      .then((d) => setPubs(d.results))
      .catch(() => setPubs([]))
  }, [])

  // Static columns — anchors + real API + external
  const exploreLinks: FooterLink[] = [
    { label: "Dashboard", href: "#dashboard-section" },
    { label: "Publications", href: "#publications-section" },
    { label: "About the Dataset", href: "#about-section" },
    { label: "CSIS Website", href: "https://csis.or.id", external: true },
  ]

  const contactLinks: FooterLink[] = [
    { label: "ra.ir@csis.or.id", href: "mailto:ra.ir@csis.or.id" },
    { label: "violence.csis.or.id", href: "https://violence.csis.or.id", external: true },
    { label: "AP R2P", href: "https://r2pasiapacific.org/", external: true },
    { label: "APPAP — UQ", href: "https://appap.group.uq.edu.au/", external: true },
  ]

  const partners = [
    { name: "CSIS Indonesia", url: "https://csis.or.id", logo: "/partner-csis.png" },
    { name: "APPAP — University of Queensland", url: "https://appap.group.uq.edu.au/", logo: "/partner-appap.png" },
    { name: "AP R2P", url: "https://r2pasiapacific.org/", logo: "/partner-apr2p.jpg" },
  ]

  const linkStyle: React.CSSProperties = {
    fontFamily: "Poppins, Inter, sans-serif",
    fontSize: 14,
    fontWeight: 400,
    color: T["on-dark-soft"],
    textDecoration: "none",
    transition: "color 0.15s",
    lineHeight: 1.4,
  }

  const headStyle: React.CSSProperties = {
    fontFamily: "Poppins, Inter, sans-serif",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: T["on-dark-soft"],
    margin: "0 0 16px",
    lineHeight: 1.4,
  }

  function renderLinks(links: FooterLink[]) {
    return (
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = T["on-dark"])}
              onMouseLeave={(e) => (e.currentTarget.style.color = T["on-dark-soft"])}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <footer style={{ background: T["surface-dark"], padding: "64px 32px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Top grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr repeat(3, 1fr)",
            gap: 48,
            marginBottom: 48,
            alignItems: "start",
          }}
        >
          {/* Brand col */}
          <div>
            <img
              src="/logo-full-white.png"
              alt="CVEW"
              style={{ height: 36, width: "auto", display: "block", marginBottom: 16 }}
            />
            <p
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 14,
                color: T["on-dark-soft"],
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 280,
                fontWeight: 400,
              }}
            >
              The Collective Violence Early Warning Dataset — a comprehensive monitoring tool for collective violence and conflict in Indonesia, by CSIS Indonesia.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 style={headStyle}>Explore</h4>
            {renderLinks(exploreLinks)}
          </div>

          {/* Publications — dynamic from /api/publications/ */}
          <div>
            <h4 style={headStyle}>Publications</h4>
            {pubs.length === 0 ? (
              <p style={{ ...linkStyle, fontStyle: "italic", opacity: 0.7 }}>Loading…</p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {pubs.map((p) => (
                  <li key={p.id}>
                    <a
                      href={`https://cvew.csis.or.id${p.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.color = T["on-dark"])}
                      onMouseLeave={(e) => (e.currentTarget.style.color = T["on-dark-soft"])}
                    >
                      {p.title.length > 60 ? p.title.slice(0, 60) + "…" : p.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 style={headStyle}>Contact</h4>
            {renderLinks(contactLinks)}
          </div>
        </div>

        {/* Partners row */}
        <div
          style={{
            borderTop: `1px solid ${T.hairline}`,
            paddingTop: 24,
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: T["on-dark-soft"],
              margin: "0 0 12px",
            }}
          >
            Data Partners
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {partners.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                title={p.name}
                style={{
                  background: "rgba(250,249,245,0.92)",
                  border: "1px solid rgba(250,249,245,0.16)",
                  borderRadius: 8,
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 64,
                  minWidth: 140,
                  transition: "background 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#faf9f5"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(250,249,245,0.92)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: `1px solid ${T.hairline}`,
            paddingTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 13,
              color: T["on-dark-soft"],
              margin: 0,
              fontWeight: 400,
            }}
          >
            © {currentYear} CSIS Indonesia. CVEW Dataset for research and atrocities prevention purposes.
          </p>
          <p
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 13,
              color: T["on-dark-soft"],
              margin: 0,
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            Suggested citation: Lina Alexandra, Farhan Julianto. "CVEW Dataset," CSIS Indonesia, 2023.
          </p>
        </div>
      </div>
    </footer>
  )
}
