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

        {/* MOBILE hamburger / close button */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            style={{
              background: menuOpen ? T["surface-card"] : "transparent",
              border: `1px solid ${T.hairline}`,
              borderRadius: 10,
              width: 44,
              height: 44,
              position: "relative",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              transition: "background 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 20,
                height: 2,
                background: T.ink,
                borderRadius: 2,
                transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                transform: menuOpen
                  ? "translate(-50%, -50%) rotate(45deg)"
                  : "translate(-50%, calc(-50% - 5px))",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 20,
                height: 2,
                background: T.ink,
                borderRadius: 2,
                transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                transform: menuOpen
                  ? "translate(-50%, -50%) rotate(-45deg)"
                  : "translate(-50%, calc(-50% + 5px))",
              }}
            />
          </button>
        )}
      </div>

      {/* MOBILE full-screen sheet */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            aria-hidden
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(20,20,19,0.4)",
              zIndex: 28,
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "auto" : "none",
              transition: "opacity 0.25s ease",
            }}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              bottom: 0,
              background: T.canvas,
              zIndex: 29,
              transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 12px 32px rgba(20,20,19,0.08)",
            }}
          >
            {/* Section label */}
            <div
              style={{
                padding: "20px 20px 8px",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: T.muted,
              }}
            >
              Menu
            </div>

            {/* Links — large rows with chevron */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
              {navLinks.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 56,
                    padding: "0 16px",
                    margin: "2px 4px",
                    borderRadius: 12,
                    color: T.ink,
                    fontFamily: "PT Serif, Georgia, serif",
                    fontSize: 19,
                    fontWeight: 500,
                    textDecoration: "none",
                    letterSpacing: "-0.2px",
                    transition: "background 0.15s, transform 0.4s, opacity 0.4s",
                    transitionDelay: menuOpen ? `${80 + i * 50}ms` : "0ms",
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onTouchStart={(e) => (e.currentTarget.style.background = T["surface-card"])}
                  onTouchEnd={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{link.label}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 6l6 6-6 6" stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </nav>

            {/* CTA — anchored bottom with safe-area */}
            <div
              style={{
                padding: "12px 20px calc(20px + env(safe-area-inset-bottom))",
                borderTop: `1px solid ${T.hairline}`,
                background: T.canvas,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.4s, transform 0.4s",
                transitionDelay: menuOpen ? "240ms" : "0ms",
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onOpenDrawer()
                }}
                style={{
                  width: "100%",
                  background: T.primary,
                  border: "none",
                  color: T["on-primary"],
                  fontFamily: "Poppins, Inter, sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "0 20px",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  height: 52,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T["on-primary"],
                    opacity: 0.85,
                    animation: "pulse 1.5s ease-in-out infinite",
                    flexShrink: 0,
                  }}
                />
                Latest Reports
                <span
                  style={{
                    marginLeft: 4,
                    background: "rgba(255,255,255,0.18)",
                    color: T["on-primary"],
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 9999,
                    lineHeight: 1.4,
                  }}
                >
                  8 new
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
