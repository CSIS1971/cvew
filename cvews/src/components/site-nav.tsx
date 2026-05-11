import { useEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"

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
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen, isMobile])

  // Close on escape
  useEffect(() => {
    if (!menuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

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
          padding: isMobile ? "0 16px" : "0 24px",
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/logo-full-black.png"
            alt="CVEW — Collective Violence Early Warning"
            style={{ height: isMobile ? 28 : 32, width: "auto", display: "block" }}
          />
        </a>

        {/* DESKTOP nav links + CTA */}
        {!isMobile && (
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
        )}

        {/* MOBILE hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            style={{
              background: "transparent",
              border: `1px solid ${T.hairline}`,
              borderRadius: 8,
              width: 40,
              height: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: T.ink,
                borderRadius: 2,
                transition: "transform 0.2s, opacity 0.2s",
                transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: T.ink,
                borderRadius: 2,
                transition: "opacity 0.2s",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: T.ink,
                borderRadius: 2,
                transition: "transform 0.2s",
                transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        )}
      </div>

      {/* MOBILE slide-down menu */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: T.canvas,
            zIndex: 29,
            transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
            display: "flex",
            flexDirection: "column",
            padding: 24,
            gap: 4,
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: T.ink,
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 18,
                fontWeight: 500,
                padding: "16px 8px",
                borderBottom: `1px solid ${T.hairline}`,
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}

          <button
            onClick={() => {
              setMenuOpen(false)
              onOpenDrawer()
            }}
            style={{
              marginTop: 24,
              background: T.primary,
              border: "none",
              color: T["on-primary"],
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 15,
              fontWeight: 500,
              padding: "14px 16px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 48,
            }}
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
      )}
    </nav>
  )
}
