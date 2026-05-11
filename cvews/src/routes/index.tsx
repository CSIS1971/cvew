import { useEffect, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { SiteNav } from "@/components/site-nav"
import { MapHero } from "@/components/map-hero"
import { ArticlesDrawer } from "@/components/articles-drawer"
import { IncidentChart } from "@/components/incident-chart"
import { PublicationsSection } from "@/components/publications-section"
import { AboutSection } from "@/components/about-section"
import { SiteFooter } from "@/components/site-footer"

export const Route = createFileRoute("/")({ component: LandingPage })

// Scroll-reveal wrapper — fades + slides up on viewport entry
function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
          observer.unobserve(el)
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  )
}

function LandingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteNav onOpenDrawer={() => setDrawerOpen(true)} />

      <div style={{ paddingTop: 64, flex: 1 }}>
        <MapHero onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Sections below hero scroll OVER the fixed map */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
            <IncidentChart />
          </Reveal>

          <Reveal>
            <PublicationsSection />
          </Reveal>

          <Reveal>
            <AboutSection />
          </Reveal>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <Reveal>
          <SiteFooter />
        </Reveal>
      </div>

      <ArticlesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
