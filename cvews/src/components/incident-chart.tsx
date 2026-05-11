import { useEffect, useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  fetchJson,
  type MonthlyResponse,
  type ViolenceFormsResponse,
  type DashboardOverview,
} from "@/lib/api"

const T = {
  canvas: "#faf9f5",
  "surface-soft": "#f5f0e8",
  "surface-card": "#efe9de",
  "surface-cream-strong": "#e8e0d2",
  ink: "#141413",
  body: "#3d3d3a",
  muted: "#6c6a64",
  "muted-soft": "#8e8b82",
  hairline: "#e6dfd8",
  primary: "#005357",
  error: "#c64545",
  "accent-amber": "#e8a55a",
  warning: "#d4a017",
  success: "#5db872",
  "accent-teal": "#5db8a6",
}

// Stable color sequence for violence form bars
const FORM_COLORS = [T.primary, T["accent-amber"], T.error, T["accent-teal"], T.warning, T.success]

const MONTH_SHORT: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec",
}

function EmptyState({ label, detail }: { label: string; detail?: string }) {
  return (
    <div
      style={{
        height: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        color: T.muted,
        fontFamily: "Poppins, Inter, sans-serif",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      <div style={{ fontWeight: 500 }}>{label}</div>
      {detail && (
        <div style={{ fontSize: 11, color: T["muted-soft"], maxWidth: 320 }}>{detail}</div>
      )}
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: T.canvas,
        border: `1px solid ${T.hairline}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: "Poppins, Inter, sans-serif",
        fontSize: 12,
        boxShadow: "0 1px 3px rgba(20,20,19,0.08)",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 6, color: T.ink }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ color: T.muted, textTransform: "capitalize" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: T.ink }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: T["surface-card"],
  borderRadius: 12,
  padding: 32,
}

const headingStyle: React.CSSProperties = {
  fontFamily: "PT Serif, Georgia, serif",
  fontSize: 18,
  fontWeight: 700,
  color: T.ink,
  margin: "0 0 4px",
  lineHeight: 1.4,
  letterSpacing: "-0.2px",
}

const subStyle: React.CSSProperties = {
  fontFamily: "Poppins, Inter, sans-serif",
  fontSize: 13,
  color: T.muted,
  margin: "0 0 24px",
  fontWeight: 400,
}

const yearSelectStyle: React.CSSProperties = {
  fontFamily: "Poppins, Inter, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${T.hairline}`,
  background: T.canvas,
  color: T.ink,
  cursor: "pointer",
}

// — Monthly Trends Chart —
function MonthlyTrendsChart() {
  const [data, setData] = useState<MonthlyResponse>([])
  const [year, setYear] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJson<MonthlyResponse>("/api/incidents/monthly/")
      .then((d) => setData(d))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  const years = useMemo(
    () => data.map((y) => String(y.year)).sort().reverse(),
    [data]
  )

  useEffect(() => {
    if (years.length && !years.includes(year)) setYear(years[0])
  }, [years, year])

  const chartData = useMemo(() => {
    const yearEntry = data.find((y) => String(y.year) === year)
    const rows = yearEntry?.data ?? []
    return rows.map((row) => ({
      month: MONTH_SHORT[row.month] ?? row.month.slice(0, 3),
      incidents: row.incidents,
      deaths: row.total_deaths ?? 0,
      injuries: row.total_injuries ?? 0,
    }))
  }, [data, year])

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <h3 style={{ ...headingStyle, margin: 0 }}>Monthly Incident Trends</h3>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={yearSelectStyle}
          aria-label="Select year"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <p style={{ ...subStyle, marginTop: 6 }}>
        Incidents, deaths, and injuries by month
        {loading ? " · loading…" : ""}
        {error ? ` · API error: ${error}` : ""}
      </p>
      {!loading && data.length === 0 && !error && (
        <EmptyState label="No data available" />
      )}
      {error && <EmptyState label="Failed to load data" detail={error} />}
      {!error && data.length > 0 && (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="g-incidents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.primary} stopOpacity={0.32} />
              <stop offset="95%" stopColor={T.primary} stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="g-deaths" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.error} stopOpacity={0.22} />
              <stop offset="95%" stopColor={T.error} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="g-injuries" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T["accent-amber"]} stopOpacity={0.2} />
              <stop offset="95%" stopColor={T["accent-amber"]} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.hairline} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: T["muted-soft"], fontFamily: "Poppins, Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: T["muted-soft"], fontFamily: "Poppins, Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16, fontFamily: "Poppins, Inter, sans-serif" }}
            formatter={(v) => <span style={{ color: T.muted, textTransform: "capitalize" }}>{v}</span>}
          />
          <Area type="monotone" dataKey="incidents" stroke={T.primary} strokeWidth={2} fill="url(#g-incidents)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="deaths" stroke={T.error} strokeWidth={1.5} fill="url(#g-deaths)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="injuries" stroke={T["accent-amber"]} strokeWidth={1.5} fill="url(#g-injuries)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}

// — Violence Forms Chart —
function ViolenceFormsChart() {
  const [data, setData] = useState<ViolenceFormsResponse>({ format: "monthly", data: [] })
  const [year, setYear] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJson<ViolenceFormsResponse>("/api/violence/forms/analytics/?format=monthly")
      .then((d) => setData(d))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  const years = useMemo(
    () => (data.data ?? []).map((y) => String(y.year)).sort().reverse(),
    [data]
  )

  useEffect(() => {
    if (years.length && !years.includes(year)) setYear(years[0])
  }, [years, year])

  // Collect all violence form keys present for the selected year (skip zero-only forms)
  const { chartData, formKeys } = useMemo(() => {
    const yearEntry = (data.data ?? []).find((y) => String(y.year) === year)
    const months = yearEntry?.months ?? []

    // Aggregate per-form totals to filter zero-only forms
    const formTotals: Record<string, number> = {}
    months.forEach((m) =>
      Object.entries(m.violence_forms).forEach(([k, v]) => {
        formTotals[k] = (formTotals[k] ?? 0) + v
      })
    )
    // Normalize duplicate keys (e.g. "Serangan Bersenjata" vs "SERANGAN BERSENJATA")
    const keys = Object.keys(formTotals).filter((k) => formTotals[k] > 0)

    const ordered = [...months]
      .sort((a, b) => a.month_number - b.month_number)
      .map((m) => {
        const row: Record<string, string | number> = {
          month: MONTH_SHORT[m.month] ?? m.month.slice(0, 3),
        }
        keys.forEach((k) => {
          row[k] = m.violence_forms[k] ?? 0
        })
        return row
      })

    return { chartData: ordered, formKeys: keys }
  }, [data, year])

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <h3 style={{ ...headingStyle, margin: 0 }}>Violence Forms Distribution</h3>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={yearSelectStyle}
          aria-label="Select year"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <p style={{ ...subStyle, marginTop: 6 }}>
        Distribution of violence forms by month
        {loading ? " · loading…" : ""}
        {error ? ` · API error: ${error}` : ""}
      </p>
      {!loading && data.data.length === 0 && !error && (
        <EmptyState label="No data available" />
      )}
      {error && <EmptyState label="Failed to load data" detail={error} />}
      {!error && data.data.length > 0 && (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={T.hairline} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: T["muted-soft"], fontFamily: "Poppins, Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: T["muted-soft"], fontFamily: "Poppins, Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16, fontFamily: "Poppins, Inter, sans-serif" }}
            formatter={(v) => <span style={{ color: T.muted }}>{v}</span>}
          />
          {formKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="forms"
              fill={FORM_COLORS[i % FORM_COLORS.length]}
              radius={i === formKeys.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}

// — Top Provinces horizontal bar —
function TopProvincesChart({ data }: { data: DashboardOverview }) {
  const chartData = data.top_provinces.map((p) => ({
    province: p.province
      .replace("SULAWESI", "SULAWESI ")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    incidents: p.count,
  }))
  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>Top Provinces</h3>
      <p style={subStyle}>Provinces with highest incident counts</p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 0, left: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={T.hairline} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: T["muted-soft"], fontFamily: "Poppins, Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="province"
            tick={{ fontSize: 11, fill: T["muted-soft"], fontFamily: "Poppins, Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="incidents" fill={T.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// — Casualties donut —
const DONUT_COLORS = [T.error, T["accent-amber"], T.warning, T["accent-teal"]]

function CasualtiesDonut({ data }: { data: DashboardOverview }) {
  const slices = [
    { name: "Total Deaths", value: data.casualties.deaths },
    { name: "Total Injuries", value: data.casualties.injuries },
    { name: "Female Deaths", value: data.casualties.female_deaths },
    { name: "Child Deaths", value: data.casualties.child_deaths },
  ].filter((s) => s.value > 0)

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>Casualties Breakdown</h3>
      <p style={subStyle}>Cumulative deaths and injuries across all recorded incidents</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            stroke="none"
          >
            {slices.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12, fontFamily: "Poppins, Inter, sans-serif" }}
            formatter={(v) => <span style={{ color: T.muted }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function IncidentChart() {
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null)
  const [dashError, setDashError] = useState<string | null>(null)

  useEffect(() => {
    fetchJson<DashboardOverview>("/api/dashboard/overview/")
      .then(setDashboard)
      .catch((e) => setDashError(String(e?.message ?? e)))
  }, [])

  return (
    <section
      id="dashboard-section"
      style={{
        padding: "96px 24px",
        background: T.canvas,
        borderTop: `1px solid ${T.hairline}`,
        scrollMarginTop: 80,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
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
            Dashboard
          </span>
          <h2
            style={{
              fontFamily: "PT Serif, Georgia, serif",
              fontSize: 48,
              fontWeight: 700,
              margin: "8px 0 10px",
              color: T.ink,
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Incident Trends
          </h2>
          <p
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 16,
              color: T.muted,
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.55,
              maxWidth: 720,
            }}
          >
            Monthly trends of violent incidents across Indonesian provinces — casualties and violence forms by month, drawn from the live CVEW API.
          </p>
        </div>

        {/* Charts grid — top row: trends + violence forms */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 24,
          }}
        >
          <MonthlyTrendsChart />
          <ViolenceFormsChart />
        </div>

        {/* Bottom row: provinces + casualties */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
            marginTop: 24,
          }}
        >
          {dashboard ? (
            <>
              <TopProvincesChart data={dashboard} />
              <CasualtiesDonut data={dashboard} />
            </>
          ) : (
            <>
              <div style={cardStyle}>
                <h3 style={headingStyle}>Top Provinces</h3>
                <p style={subStyle}>
                  {dashError ? `API error: ${dashError}` : "Loading…"}
                </p>
                <EmptyState
                  label={dashError ? "Failed to load" : "Loading dashboard…"}
                  detail={dashError ?? undefined}
                />
              </div>
              <div style={cardStyle}>
                <h3 style={headingStyle}>Casualties Breakdown</h3>
                <p style={subStyle}>
                  {dashError ? `API error: ${dashError}` : "Loading…"}
                </p>
                <EmptyState
                  label={dashError ? "Failed to load" : "Loading dashboard…"}
                  detail={dashError ?? undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
