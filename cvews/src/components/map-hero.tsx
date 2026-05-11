import { Map, MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map"
import { useIsMobile } from "@/hooks/use-is-mobile"

// Severity colors from DESIGN.md
const SEVERITY_COLOR: Record<string, string> = {
  critical: "#c64545",
  high: "#e8a55a",
  medium: "#d4a017",
  low: "#5db872",
}

// Indonesia conflict/tension hotspots
const INCIDENTS = [
  { id: 1, lng: 140.72, lat: -4.08, severity: "critical", label: "Nduga, Papua", count: 31, category: "Armed Conflict" },
  { id: 2, lng: 137.08, lat: -4.77, severity: "critical", label: "Puncak Jaya", count: 27, category: "Armed Conflict" },
  { id: 3, lng: 134.06, lat: -1.33, severity: "high", label: "Manokwari", count: 14, category: "Civil Unrest" },
  { id: 4, lng: 131.25, lat: -0.89, severity: "high", label: "Sorong", count: 11, category: "Protest" },
  { id: 5, lng: 120.74, lat: -1.48, severity: "high", label: "Poso, Sulawesi", count: 18, category: "Religious Tension" },
  { id: 6, lng: 128.18, lat: -3.69, severity: "medium", label: "Ambon, Maluku", count: 9, category: "Civil Unrest" },
  { id: 7, lng: 95.32, lat: 5.55, severity: "medium", label: "Banda Aceh", count: 7, category: "Protest" },
  { id: 8, lng: 106.82, lat: -6.21, severity: "medium", label: "Jakarta", count: 12, category: "Mass Protest" },
  { id: 9, lng: 117.15, lat: -0.50, severity: "low", label: "Samarinda, Kaltim", count: 5, category: "Land Dispute" },
  { id: 10, lng: 110.37, lat: -7.80, severity: "low", label: "Yogyakarta", count: 3, category: "Protest" },
  { id: 11, lng: 123.58, lat: 0.79, severity: "medium", label: "Gorontalo, Sulawesi", count: 8, category: "Ethnic Tension" },
  { id: 12, lng: 140.38, lat: -8.56, severity: "high", label: "Merauke, Papua", count: 16, category: "Armed Conflict" },
]

interface MapHeroProps {
  onOpenDrawer: () => void
}

function SeverityDot({ severity, count }: { severity: string; count: number }) {
  const color = SEVERITY_COLOR[severity]
  const size = Math.max(14, Math.min(42, count * 1.2))
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        border: "2px solid rgba(255,255,255,0.25)",
        cursor: "pointer",
        boxShadow: `0 0 ${size / 2}px ${color}88`,
        animation: "pulse-marker 2.5s ease-in-out infinite",
      }}
    />
  )
}

export function MapHero({ onOpenDrawer }: MapHeroProps) {
  const isMobile = useIsMobile()
  return (
    <section className="relative w-full" style={{ height: isMobile ? "70vh" : "82vh", minHeight: isMobile ? 420 : 540 }}>
      {/* Fixed map background — stays in viewport while hero scrolls past */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "100vh",
          zIndex: 0,
          pointerEvents: "auto",
        }}
      >
        <Map
          center={[118.0, -2.5]}
          zoom={4.4}
          theme="dark"
          className="h-full w-full"
          interactive={false}
          dragPan={false}
          scrollZoom={false}
          doubleClickZoom={false}
          dragRotate={false}
          touchZoomRotate={false}
          keyboard={false}
          boxZoom={false}
        >

          {INCIDENTS.map((incident) => (
            <MapMarker
              key={incident.id}
              longitude={incident.lng}
              latitude={incident.lat}
            >
              <MarkerContent>
                <SeverityDot severity={incident.severity} count={incident.count} />
              </MarkerContent>
              <MarkerPopup>
                <div
                  style={{
                    fontFamily: "Poppins, Inter, sans-serif",
                    minWidth: 160,
                    padding: "2px 0",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    {incident.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: SEVERITY_COLOR[incident.severity],
                      }}
                    >
                      {incident.severity}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>· {incident.count} incidents</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>{incident.category}</div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>
      </div>

      {/* Gradient overlay — dark navy toned */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(24,23,21,0.72) 0%, rgba(24,23,21,0.08) 38%, rgba(24,23,21,0.08) 60%, rgba(24,23,21,0.62) 100%)",
          zIndex: 1,
        }}
      />

      {/* Hero text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4"
        style={{ zIndex: 2 }}
      >
        <h1
          style={{
            fontFamily: "PT Serif, Georgia, serif",
            fontSize: isMobile ? "clamp(32px, 9vw, 44px)" : "clamp(48px, 8vw, 84px)",
            fontWeight: 700,
            color: "#faf9f5",
            letterSpacing: isMobile ? "-0.8px" : "-1.5px",
            lineHeight: 1.05,
            margin: "0 0 16px",
            textAlign: "center",
          }}
        >
          The Violence Dataset
        </h1>

        <p
          style={{
            fontFamily: "Poppins, Inter, sans-serif",
            fontSize: isMobile ? 14 : 17,
            fontWeight: 400,
            color: "rgba(250,249,245,0.72)",
            lineHeight: 1.55,
            margin: 0,
            textAlign: "center",
            maxWidth: 620,
          }}
        >
          The Collective Violence Early Warning (CVEW) Dataset — a comprehensive monitoring tool and early warning system for collective violence and conflict in Indonesia.
        </p>
      </div>

      {/* Latest Reports button — hidden on mobile (mobile uses nav hamburger menu) */}
      {!isMobile && <button
        onClick={onOpenDrawer}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 3,
          background: "#252320",
          border: "1px solid rgba(250,249,245,0.12)",
          color: "#faf9f5",
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
        onMouseEnter={(e) => (e.currentTarget.style.background = "#2e2c28")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#252320")}
      >
        Latest Reports
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#c64545",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          8
        </span>
      </button>}

      <style>{`
        @keyframes pulse-marker {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.18); opacity: 1; }
        }
      `}</style>
    </section>
  )
}
