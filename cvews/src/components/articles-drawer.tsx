import { useEffect, useRef, useState } from "react"
import {
  fetchJson,
  type IncidentItem,
  type PaginatedIncidents,
} from "@/lib/api"

const T = {
  canvas: "#faf9f5",
  "surface-soft": "#f5f0e8",
  "surface-card": "#efe9de",
  "surface-cream-strong": "#e8e0d2",
  ink: "#141413",
  body: "#3d3d3a",
  muted: "#6c6a64",
  hairline: "#e6dfd8",
  primary: "#005357",
  "primary-active": "#003d40",
  "on-primary": "#ffffff",
  error: "#c64545",
  "accent-amber": "#e8a55a",
  warning: "#d4a017",
  success: "#5db872",
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: T.error,
  high: T["accent-amber"],
  medium: T.warning,
  low: T.success,
}

// Severity inferred from casualty totals (no severity field in real model)
function severityForIncident(inc: IncidentItem): "critical" | "high" | "medium" | "low" {
  const c = inc.casualties
  if (!c) return "low"
  const deaths = c.deaths ?? 0
  const injuries = c.injuries ?? 0
  if (deaths >= 5) return "critical"
  if (deaths >= 1 || injuries >= 10) return "high"
  if (injuries >= 1) return "medium"
  return "low"
}

const FILTERS = ["All", "Critical", "High", "Medium", "Low"]

interface ArticlesDrawerProps {
  open: boolean
  onClose: () => void
}

export function ArticlesDrawer({ open, onClose }: ArticlesDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<IncidentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>("All")

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Fetch latest incidents on first open
  useEffect(() => {
    if (!open || items.length > 0 || loading) return
    setLoading(true)
    fetchJson<PaginatedIncidents>("/api/incidents/?limit=20")
      .then((d) => setItems(d.results))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [open, items.length, loading])

  const filtered = activeFilter === "All"
    ? items
    : items.filter((i) => severityForIncident(i) === activeFilter.toLowerCase())

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20,20,19,0.35)",
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 92vw)",
          background: T.canvas,
          borderLeft: `1px solid ${T.hairline}`,
          zIndex: 50,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(20,20,19,0.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${T.hairline}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
            background: T.canvas,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "PT Serif, Georgia, serif",
                fontSize: 24,
                fontWeight: 400,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: "-0.3px",
                color: T.ink,
              }}
            >
              Latest Reports
            </h2>
            <p
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 13,
                color: T.muted,
                margin: "4px 0 0",
                fontWeight: 400,
              }}
            >
              {loading ? "Loading…" : `${items.length} incidents · Live data`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${T.hairline}`,
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.muted,
              fontSize: 18,
              lineHeight: 1,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            ×
          </button>
        </div>

        {/* Filter chips — category-tab style */}
        <div
          style={{
            padding: "10px 24px",
            borderBottom: `1px solid ${T["hairline"]}`,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            flexShrink: 0,
            background: T.canvas,
          }}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontFamily: "Poppins, Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1px solid ${T.hairline}`,
                  background: active ? T["surface-cream-strong"] : "transparent",
                  color: active ? T.ink : T.muted,
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = T["surface-card"]
                    e.currentTarget.style.color = T.ink
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = T.muted
                  }
                }}
              >
                {f}
              </button>
            )
          })}
        </div>

        {/* Articles list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div
              style={{
                padding: "24px",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 13,
                color: T.muted,
                textAlign: "center",
              }}
            >
              Loading incidents…
            </div>
          )}
          {error && !loading && (
            <div
              style={{
                padding: "24px",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 13,
                color: T.error,
                textAlign: "center",
              }}
            >
              Failed to load: {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div
              style={{
                padding: "24px",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 13,
                color: T.muted,
                textAlign: "center",
              }}
            >
              No incidents match this filter.
            </div>
          )}
          {filtered.map((inc) => {
            const sev = severityForIncident(inc)
            const color = SEVERITY_COLOR[sev]
            const dateStr = inc.date
              ? new Date(inc.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : ""
            const summary = inc.description.length > 220
              ? inc.description.slice(0, 220).trim() + "…"
              : inc.description
            const cat = inc.categories[0] ?? "Incident"
            return (
              <article
                key={inc.id}
                style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${T.hairline}`,
                  cursor: inc.link ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onClick={() => {
                  if (inc.link) window.open(inc.link, "_blank", "noopener,noreferrer")
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T["surface-soft"])}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span
                    style={{
                      fontFamily: "Poppins, Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: "1.2px",
                      textTransform: "uppercase",
                      color,
                      background: T["surface-card"],
                      padding: "3px 10px",
                      borderRadius: 9999,
                      border: `1px solid ${T.hairline}`,
                    }}
                  >
                    {sev}
                  </span>
                  <span
                    style={{
                      fontFamily: "Poppins, Inter, sans-serif",
                      fontSize: 12,
                      color: T.muted,
                      fontWeight: 400,
                    }}
                  >
                    {cat}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "PT Serif, Georgia, serif",
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    margin: "0 0 6px",
                    color: T.ink,
                    letterSpacing: "-0.1px",
                  }}
                >
                  {inc.incident_id}
                </h3>

                <p
                  style={{
                    fontFamily: "Poppins, Inter, sans-serif",
                    fontSize: 13,
                    color: T.body,
                    lineHeight: 1.55,
                    margin: "0 0 10px",
                    fontWeight: 400,
                  }}
                >
                  {summary}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "Poppins, Inter, sans-serif",
                    fontSize: 12,
                    color: T.muted,
                  }}
                >
                  <span>{inc.location ?? "Unknown"}</span>
                  <span>{dateStr}</span>
                </div>
              </article>
            )
          })}
        </div>

        {/* CTA footer — button-primary coral */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${T.hairline}`,
            flexShrink: 0,
            background: T.canvas,
          }}
        >
          <button
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: T.primary,
              color: T["on-primary"],
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              height: 40,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T["primary-active"])}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
          >
            View All Incidents
          </button>
        </div>
      </div>
    </>
  )
}
