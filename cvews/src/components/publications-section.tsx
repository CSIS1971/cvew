import { useEffect, useRef, useState } from "react"
import {
  fetchJson,
  mediaUrl,
  type PaginatedPublications,
  type Publication,
} from "@/lib/api"

const T = {
  canvas: "#faf9f5",
  primary: "#005357",
  "primary-active": "#003d40",
  "on-primary": "#faf9f5",
  "on-dark-soft": "#a09d96",
  hairline: "rgba(250,249,245,0.12)",
}

const arrowBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  border: "1px solid rgba(250,249,245,0.25)",
  background: "rgba(250,249,245,0.08)",
  color: "#faf9f5",
  cursor: "pointer",
  fontSize: 16,
  fontFamily: "Poppins, Inter, sans-serif",
  transition: "background 0.15s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}

export function PublicationsSection() {
  const [pubs, setPubs] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchJson<PaginatedPublications>("/api/publications/?limit=20")
      .then((d) => setPubs(d.results))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  // Map vertical mouse wheel → horizontal scroll inside the carousel
  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
  }

  function scrollByCard(dir: 1 | -1) {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector("article")
    const step = card ? (card as HTMLElement).offsetWidth + 20 : 320
    el.scrollBy({ left: dir * step, behavior: "smooth" })
  }

  return (
    <section
      id="publications-section"
      style={{
        background: T.primary,
        padding: "96px 0",
        scrollMarginTop: 80,
        overflow: "hidden",
      }}
    >
      <style>{`
        .pub-scroll::-webkit-scrollbar { height: 10px; }
        .pub-scroll::-webkit-scrollbar-track { background: rgba(250,249,245,0.08); border-radius: 6px; }
        .pub-scroll::-webkit-scrollbar-thumb { background: rgba(250,249,245,0.35); border-radius: 6px; }
        .pub-scroll::-webkit-scrollbar-thumb:hover { background: rgba(250,249,245,0.55); }
        .pub-scroll > article { flex: 0 0 360px; }
        @media (max-width: 900px) {
          .pub-scroll > article { flex: 0 0 280px !important; }
        }
        @media (max-width: 560px) {
          .pub-scroll > article { flex: 0 0 78vw !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(250,249,245,0.65)",
            }}
          >
            Publications
          </span>
          <h2
            style={{
              fontFamily: "PT Serif, Georgia, serif",
              fontSize: 48,
              fontWeight: 700,
              margin: "8px 0 10px",
              color: T["on-primary"],
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Research & Analysis
          </h2>
          <p
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 16,
              color: "rgba(250,249,245,0.72)",
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.55,
              maxWidth: 720,
            }}
          >
            Research publications, policy briefs, and analytical reports on collective violence in Indonesia. In-depth analysis of violence patterns, conflict dynamics, and prevention strategies.
          </p>
        </div>
      </div>

      {/* Scroll arrows — bleed-aligned with header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll publications left"
          style={arrowBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.08)")}
        >
          ←
        </button>
        <button
          onClick={() => scrollByCard(1)}
          aria-label="Scroll publications right"
          style={arrowBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.08)")}
        >
          →
        </button>
      </div>

      {/* Scroll container — left aligns with header, bleeds past right viewport edge */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        className="pub-scroll"
        style={{
          display: "flex",
          gap: 20,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollSnapStop: "always",
          scrollPaddingLeft: "max(24px, calc((100vw - 1200px) / 2 + 24px))",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(250,249,245,0.35) transparent",
          paddingBottom: 16,
          paddingLeft: "max(24px, calc((100vw - 1200px) / 2 + 24px))",
          paddingRight: 24,
        }}
      >
          {loading && (
            <div
              style={{
                color: "rgba(250,249,245,0.7)",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 14,
                padding: "24px",
              }}
            >
              Loading publications…
            </div>
          )}
          {error && !loading && (
            <div
              style={{
                color: "rgba(250,249,245,0.7)",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 14,
                padding: "24px",
              }}
            >
              Failed to load publications: {error}
            </div>
          )}
          {!loading && !error && pubs.length === 0 && (
            <div
              style={{
                color: "rgba(250,249,245,0.7)",
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 14,
                padding: "24px",
              }}
            >
              No publications available.
            </div>
          )}
          {pubs.map((pub) => {
            const cover = mediaUrl(pub.cover)
            const file = mediaUrl(pub.file)
            const detailUrl = `https://cvew.csis.or.id${pub.url}`
            return (
            <article
              key={pub.id}
              style={{
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                background: "rgba(250,249,245,0.06)",
                border: "1px solid rgba(250,249,245,0.1)",
                borderRadius: 12,
                overflow: "hidden",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(250,249,245,0.1)"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(250,249,245,0.06)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              {/* Cover */}
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: "rgba(250,249,245,0.08)",
                  aspectRatio: "3 / 4",
                  overflow: "hidden",
                }}
              >
                {cover && (
                  <img
                    src={cover}
                    alt={pub.title}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
              </a>

              {/* Body */}
              <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                <h3
                  style={{
                    fontFamily: "PT Serif, Georgia, serif",
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    margin: "0 0 8px",
                    color: T["on-primary"],
                    letterSpacing: "-0.1px",
                  }}
                >
                  <a
                    href={detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {pub.title}
                  </a>
                </h3>

                <div
                  style={{
                    fontFamily: "Poppins, Inter, sans-serif",
                    fontSize: 12,
                    color: "rgba(250,249,245,0.6)",
                    marginBottom: 16,
                    fontWeight: 400,
                    flex: 1,
                  }}
                >
                  {pub.author || "—"}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  {file && (
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        background: T["on-primary"],
                        color: T.primary,
                        fontFamily: "Poppins, Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "8px 12px",
                        borderRadius: 6,
                        textDecoration: "none",
                        textAlign: "center",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f0e8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = T["on-primary"])}
                    >
                      Download PDF
                    </a>
                  )}
                  <a
                    href={detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(250,249,245,0.3)",
                      color: T["on-primary"],
                      fontFamily: "Poppins, Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "8px 12px",
                      borderRadius: 6,
                      textDecoration: "none",
                      textAlign: "center",
                      transition: "background 0.15s",
                      flex: file ? "0 0 auto" : 1,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(250,249,245,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    Detail
                  </a>
                </div>
              </div>
            </article>
            )
          })}
      </div>
    </section>
  )
}
