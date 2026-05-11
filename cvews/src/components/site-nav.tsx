// Design tokens from DESIGN.md
const T = {
  canvas: "#faf9f5",
  ink: "#141413",
  muted: "#6c6a64",
  hairline: "#e6dfd8",
  primary: "#005357",
  "primary-active": "#003d40",
  "on-primary": "#ffffff",
  "surface-card": "#efe9de",
}

interface SiteNavProps {
  onOpenDrawer: () => void
}

export function SiteNav({ onOpenDrawer }: SiteNavProps) {
  const navLinks = [
    { label: "Dashboard", href: "#dashboard-section" },
    { label: "Publications", href: "#publications-section" },
    { label: "About Us", href: "#about-section" },
  ]

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 64,
        background: "rgba(250,249,245,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(230,223,216,0.45)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <img
          src="/logo-full-black.png"
          alt="CVEW — Collective Violence Early Warning"
          style={{ height: 32, width: "auto", display: "block" }}
        />
      </a>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            style={{
              background: "transparent",
              border: "none",
              color: T.muted,
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "color 0.15s, background 0.15s",
              textDecoration: "none",
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = T.ink
              e.currentTarget.style.background = T["surface-card"]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = T.muted
              e.currentTarget.style.background = "transparent"
            }}
          >
            {link.label}
          </a>
        ))}

        <div
          style={{
            width: 1,
            height: 20,
            background: T.hairline,
            margin: "0 8px",
          }}
        />

        {/* Coral alert button */}
        <button
          onClick={onOpenDrawer}
          style={{
            background: T.primary,
            border: "none",
            color: T["on-primary"],
            fontFamily: "Poppins, Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T["primary-active"])}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T["on-primary"],
              opacity: 0.8,
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          Latest Reports
        </button>
      </div>
      </div>
    </nav>
  )
}
