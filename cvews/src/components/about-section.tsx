import { useState } from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"

const T = {
  canvas: "#faf9f5",
  "surface-soft": "#f5f0e8",
  "surface-card": "#efe9de",
  ink: "#141413",
  body: "#3d3d3a",
  muted: "#6c6a64",
  hairline: "#e6dfd8",
  primary: "#005357",
}

type Section = { id: string; title: string; body: React.ReactNode }

const SECTIONS: Section[] = [
  {
    id: "background",
    title: "Background",
    body: (
      <>
        <p>
          Findings from CSIS' 2020 Study on the Establishment of National Network for Atrocities Prevention notes that multiple stakeholders commonly view that having a violence monitoring and measuring mechanism would be greatly beneficial to Indonesia's atrocity prevention initiatives. This mechanism is especially crucial as Indonesia approaches periods of political contestation that risk increasing social conflict due to the common use of identity narratives.
        </p>
        <p>
          Up until 2014, Indonesia could rely on the National Violence Monitoring System (NVMS) as this monitoring tool. Built by the World Bank with the support of The Habibie Center, NVMS aggregated news from various local medias to provide stakeholders the first comprehensive database on violence in Indonesia. Data collection for the NVMS ended in March 2015.
        </p>
        <p>
          Although various datasets exist to substitute NVMS, all have limitations. Internationally, ACLED and the PITF Worldwide Atrocities Dataset record incidents globally but are not specified enough for Indonesia. Nationally, datasets like Habibie Center's DETEKSI or KontraS' internal database do not individually cover the breadth needed for a national early warning mechanism.
        </p>
      </>
    ),
  },
  {
    id: "purpose",
    title: "Purpose",
    body: (
      <p>
        This project aims to develop a <strong>Collective Violence Early Warning Database</strong> to act as an early warning mechanism by capturing incidents of violence across all provinces in Indonesia and analyzing data on various aspects of these violence using national and local news sources. This monitoring system collects, categorizes, and visualizes data according to the UN Framework of Analysis for Atrocity Crimes — to assess the existence and prevalence of common and specific risk factors — and Indonesia's existing regulations on protection of human rights, conflict prevention, and their NAPs.
      </p>
    ),
  },
  {
    id: "activities",
    title: "Activities",
    body: (
      <>
        <p>
          The project employs a team consisting of one lead researcher and two researchers from the Centre for Strategic and International Studies (CSIS) Jakarta, with help from data entry personnel.
        </p>
        <p>
          Phase 1 — build the codebook and data collection system. Phase 2 — collect violence incidents from online, local, reputable media (Kompas, Jawa Pos group, local newspapers), recording violence between January 2019 and December 2021. Phase 3 — analysis and visualization to identify month-to-month trends, shared with atrocities prevention stakeholders. Phase 4 — national launch of CVEW with public-facing analysis.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>Questions related to the dataset can be addressed to:</p>
        <p>
          <strong>Farhan Julianto</strong>
          <br />
          Research Assistant, Department of International Relations
          <br />
          Centre for Strategic and International Studies
        </p>
        <p>
          <a
            href="mailto:ra.ir@csis.or.id"
            style={{ color: T.primary, textDecoration: "underline" }}
          >
            ra.ir@csis.or.id
          </a>
        </p>
      </>
    ),
  },
  {
    id: "citation",
    title: "Suggested Citation",
    body: (
      <p style={{ fontStyle: "italic" }}>
        Lina Alexandra, Farhan Julianto. "Collective Violence Early Warning (CVEW) Dataset." CSIS Indonesia, 2023.
      </p>
    ),
  },
]

const PARTNERS = [
  { name: "CSIS Indonesia", url: "https://csis.or.id", logo: "/partner-csis.png" },
  { name: "APPAP — University of Queensland", url: "https://appap.group.uq.edu.au/", logo: "/partner-appap.png" },
  { name: "AP R2P", url: "https://r2pasiapacific.org/", logo: "/partner-apr2p.jpg" },
]

export function AboutSection() {
  const [openId, setOpenId] = useState<string>("contact")
  const isMobile = useIsMobile()

  return (
    <section
      id="about-section"
      style={{
        background: T.canvas,
        padding: isMobile ? "56px 16px" : "96px 24px",
        borderTop: `1px solid ${T.hairline}`,
        scrollMarginTop: 80,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: isMobile ? 28 : 48 }}>
          <span
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: T.primary,
            }}
          >
            About
          </span>
          <h2
            style={{
              fontFamily: "PT Serif, Georgia, serif",
              fontSize: isMobile ? 32 : 48,
              fontWeight: 700,
              margin: "8px 0 10px",
              color: T.ink,
              lineHeight: 1.1,
              letterSpacing: isMobile ? "-0.5px" : "-1px",
            }}
          >
            About the CVEW Dataset
          </h2>
          <p
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: isMobile ? 14 : 16,
              color: T.muted,
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 720,
            }}
          >
            Reviving the National Violence Database as an early-warning mechanism for atrocities prevention in Indonesia.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 32 : 64,
            alignItems: "start",
          }}
        >
          {/* Accordion */}
          <div>
            {SECTIONS.map((s) => {
              const open = openId === s.id
              return (
                <div
                  key={s.id}
                  style={{ borderBottom: `1px solid ${T.hairline}` }}
                >
                  <button
                    onClick={() => setOpenId(open ? "" : s.id)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "20px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      fontFamily: "PT Serif, Georgia, serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: T.ink,
                      textAlign: "left",
                      letterSpacing: "-0.1px",
                    }}
                  >
                    {s.title}
                    <span
                      style={{
                        fontFamily: "Poppins, Inter, sans-serif",
                        fontSize: 22,
                        fontWeight: 300,
                        color: T.muted,
                        lineHeight: 1,
                        transform: open ? "rotate(45deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      +
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: open ? 1200 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.4s ease, padding 0.3s ease",
                      paddingBottom: open ? 24 : 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Poppins, Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 400,
                        color: T.body,
                        lineHeight: 1.7,
                      }}
                    >
                      {s.body}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right column — lead text + partners */}
          <div>
            <h3
              style={{
                fontFamily: "PT Serif, Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: T.ink,
                margin: "0 0 16px",
                lineHeight: 1.3,
                letterSpacing: "-0.2px",
              }}
            >
              Reviving National Violence Database as Early-Warning Mechanism for Atrocities Prevention in Indonesia
            </h3>
            <p
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 14,
                color: T.body,
                lineHeight: 1.7,
                margin: "0 0 14px",
              }}
            >
              Despite the absence of any major atrocity case, Indonesia is host to several concerning risk factors. The prevalence of intolerant acts against minority groups, extremist groups, economic and social inequalities, and records of past human rights abuses are among the risks that need to be seriously monitored.
            </p>
            <p
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 14,
                color: T.body,
                lineHeight: 1.7,
                margin: "0 0 32px",
              }}
            >
              As atrocity does not happen overnight, preventing escalation at the earliest stage is key. Monitoring trends on the volume and forms of violence happening across Indonesia provides stakeholders early warning notice of possible escalation, increasing their capacity to perform atrocities prevention.
            </p>

            <div
              style={{
                paddingTop: 24,
                borderTop: `1px solid ${T.hairline}`,
              }}
            >
              <p
                style={{
                  fontFamily: "Poppins, Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: T.muted,
                  margin: "0 0 14px",
                }}
              >
                Project Partners
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                {PARTNERS.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={p.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: T["surface-card"],
                      border: `1px solid ${T.hairline}`,
                      borderRadius: 12,
                      padding: 18,
                      height: 96,
                      transition: "background 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = T["surface-soft"]
                      e.currentTarget.style.transform = "translateY(-2px)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = T["surface-card"]
                      e.currentTarget.style.transform = "translateY(0)"
                    }}
                  >
                    <img
                      src={p.logo}
                      alt={p.name}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
