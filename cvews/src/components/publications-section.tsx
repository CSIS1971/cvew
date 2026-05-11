import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  fetchJson,
  mediaUrl,
  type PaginatedPublications,
  type Publication,
} from "@/lib/api"
import { useIsMobile } from "@/hooks/use-is-mobile"

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

function Card({ pub }: { pub: Publication }) {
  const cover = mediaUrl(pub.cover)
  const file = mediaUrl(pub.file)
  const detailUrl = `https://cvew.csis.or.id${pub.url}`
  return (
    <article
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
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </a>

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
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Detail
          </a>
        </div>
      </div>
    </article>
  )
}

export function PublicationsSection() {
  const [pubs, setPubs] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Mobile horizontal scroll container
  const mobileScrollRef = useRef<HTMLDivElement>(null)

  // Desktop pin refs
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [maxScroll, setMaxScroll] = useState(0)

  useEffect(() => {
    fetchJson<PaginatedPublications>("/api/publications/?limit=20")
      .then((d) => setPubs(d.results))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  // Mobile: map vertical wheel → horizontal scroll
  function onMobileWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = mobileScrollRef.current
    if (!el) return
    if (el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
  }

  // Desktop: measure scroll distance (inner width minus viewport width)
  useLayoutEffect(() => {
    if (isMobile) return
    function measure() {
      const inner = innerRef.current
      const track = trackRef.current
      if (!inner || !track) return
      setMaxScroll(Math.max(0, inner.scrollWidth - track.clientWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (innerRef.current) ro.observe(innerRef.current)
    if (trackRef.current) ro.observe(trackRef.current)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [isMobile, pubs])

  // Desktop: translate inner based on section scroll progress
  useEffect(() => {
    if (isMobile) return
    if (maxScroll === 0) return
    const section = sectionRef.current
    const inner = innerRef.current
    if (!section || !inner) return

    let raf = 0
    function update() {
      const rect = section!.getBoundingClientRect()
      let p = -rect.top / maxScroll
      if (p < 0) p = 0
      if (p > 1) p = 1
      inner!.style.transform = `translate3d(${-p * maxScroll}px, 0, 0)`
    }
    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [isMobile, maxScroll])

  // Desktop arrows: scroll page vertically (drives horizontal translate)
  function desktopScrollByCard(dir: 1 | -1) {
    const inner = innerRef.current
    if (!inner) return
    const card = inner.querySelector("article")
    const step = card ? (card as HTMLElement).offsetWidth + 20 : 380
    window.scrollBy({ top: dir * step, behavior: "smooth" })
  }

  // Loading / error / empty placeholders
  const statusBox = (msg: string) => (
    <div
      style={{
        color: "rgba(250,249,245,0.7)",
        fontFamily: "Poppins, Inter, sans-serif",
        fontSize: 14,
        padding: 24,
      }}
    >
      {msg}
    </div>
  )

  const header = (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px" : "0 24px", width: "100%" }}>
      <div style={{ marginBottom: isMobile ? 28 : 32 }}>
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
            fontSize: isMobile ? 32 : 48,
            fontWeight: 700,
            margin: "8px 0 10px",
            color: T["on-primary"],
            lineHeight: 1.1,
            letterSpacing: isMobile ? "-0.5px" : "-1px",
          }}
        >
          Research & Analysis
        </h2>
        <p
          style={{
            fontFamily: "Poppins, Inter, sans-serif",
            fontSize: isMobile ? 14 : 16,
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
  )

  // ───────────── MOBILE ─────────────
  if (isMobile) {
    return (
      <section
        id="publications-section"
        style={{
          background: T.primary,
          padding: "56px 0",
          scrollMarginTop: 80,
          overflow: "hidden",
        }}
      >
        <style>{`
          .pub-scroll::-webkit-scrollbar { height: 10px; }
          .pub-scroll::-webkit-scrollbar-track { background: rgba(250,249,245,0.08); border-radius: 6px; }
          .pub-scroll::-webkit-scrollbar-thumb { background: rgba(250,249,245,0.35); border-radius: 6px; }
          .pub-scroll > article { flex: 0 0 78vw; }
        `}</style>

        {header}

        <div
          ref={mobileScrollRef}
          onWheel={onMobileWheel}
          className="pub-scroll"
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          {loading && statusBox("Loading publications…")}
          {error && !loading && statusBox(`Failed to load: ${error}`)}
          {!loading && !error && pubs.length === 0 && statusBox("No publications available.")}
          {pubs.map((p) => (
            <Card key={p.id} pub={p} />
          ))}
        </div>
      </section>
    )
  }

  // ───────────── DESKTOP — pinned scroll ─────────────
  // Section height = viewport + horizontal scroll distance.
  // Inner pins at top via sticky; vertical scroll progress drives translateX.
  const sectionHeight = `calc(100vh + ${maxScroll}px)`

  return (
    <section
      id="publications-section"
      ref={sectionRef}
      style={{
        background: T.primary,
        height: sectionHeight,
        position: "relative",
        scrollMarginTop: 0,
      }}
    >
      <style>{`
        .pub-desk > article { flex: 0 0 360px; }
        @media (max-width: 1100px) {
          .pub-desk > article { flex: 0 0 320px; }
        }
      `}</style>

      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingTop: 96,
          paddingBottom: 48,
          boxSizing: "border-box",
        }}
      >
        {header}

        {/* Progress + arrows row */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 2,
              background: "rgba(250,249,245,0.12)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "rgba(250,249,245,0.65)",
                width: maxScroll === 0 ? "100%" : "0%",
                transition: "width 0.05s linear",
              }}
              ref={(el) => {
                // Update progress bar inside same rAF loop via class data attr
                if (!el) return
                ;(el as HTMLDivElement & { __sync?: boolean }).__sync = true
              }}
              id="pub-progress-bar"
            />
          </div>
          <button
            onClick={() => desktopScrollByCard(-1)}
            aria-label="Previous publications"
            style={arrowBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.08)")}
          >
            ←
          </button>
          <button
            onClick={() => desktopScrollByCard(1)}
            aria-label="Next publications"
            style={arrowBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(250,249,245,0.08)")}
          >
            →
          </button>
        </div>

        {/* Horizontal track */}
        <div
          ref={trackRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            paddingLeft: "max(24px, calc((100vw - 1200px) / 2 + 24px))",
          }}
        >
          <div
            ref={innerRef}
            className="pub-desk"
            style={{
              display: "flex",
              gap: 20,
              height: "100%",
              alignItems: "stretch",
              willChange: "transform",
              paddingRight: 24,
            }}
          >
            {loading && statusBox("Loading publications…")}
            {error && !loading && statusBox(`Failed to load: ${error}`)}
            {!loading && !error && pubs.length === 0 && statusBox("No publications available.")}
            {pubs.map((p) => (
              <Card key={p.id} pub={p} />
            ))}
          </div>
        </div>
      </div>

      <ProgressSync sectionRef={sectionRef} maxScroll={maxScroll} />
    </section>
  )
}

// Updates the progress bar width in sync with the pin scroll.
function ProgressSync({
  sectionRef,
  maxScroll,
}: {
  sectionRef: React.RefObject<HTMLDivElement | null>
  maxScroll: number
}) {
  useEffect(() => {
    if (maxScroll === 0) return
    const section = sectionRef.current
    if (!section) return
    let raf = 0
    function update() {
      const bar = document.getElementById("pub-progress-bar")
      if (!bar) return
      const rect = section!.getBoundingClientRect()
      let p = -rect.top / maxScroll
      if (p < 0) p = 0
      if (p > 1) p = 1
      bar.style.width = `${p * 100}%`
    }
    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [sectionRef, maxScroll])
  return null
}
