// CVEW backend API base. Override via VITE_API_BASE.
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "https://violence.csis.or.id"

/** Resolve a media path returned by the API (e.g. /media/x.png) against API_BASE */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path}`
}

export async function fetchJson<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error(`API ${res.status} ${url}`)
  return res.json() as Promise<T>
}

// — /api/incidents/monthly/ —
export interface MonthlyRow {
  month: string
  incidents: number
  total_deaths: number
  total_injuries: number
  female_deaths?: number
  female_injuries?: number
  child_deaths?: number
  child_injuries?: number
  infra_damage?: number
  infra_destroyed?: number
}
export type MonthlyResponse = Array<{ year: number | string; data: MonthlyRow[] }>

// — /api/violence/forms/analytics/?format=monthly —
export interface VFMonth {
  month: string
  month_number: number
  total_incidents: number
  violence_forms: Record<string, number>
}
export interface ViolenceFormsResponse {
  format: string
  data: Array<{ year: string; months: VFMonth[] }>
}

// — /api/dashboard/overview/ —
export interface DashboardOverview {
  total_incidents: number
  year_incidents: number
  current_year: number
  casualties: {
    deaths: number
    injuries: number
    child_deaths: number
    female_deaths: number
  }
  top_provinces: Array<{ province: string; count: number }>
  latest_incidents: Array<{
    id: number
    incident_id: string
    date: string | null
    description: string
    location: string | null
  }>
}

// — /api/publications/ —
export interface Publication {
  id: number
  title: string
  slug: string
  author: string
  category: string | null
  cover: string | null
  file: string | null
  date_publish: string | null
  visitor_count: number
  download_count: number
  url: string
}
export interface PaginatedPublications {
  count: number
  limit: number
  offset: number
  results: Publication[]
}

// — /api/incidents/ —
export interface IncidentItem {
  id: number
  incident_id: string
  date: string | null
  location: string | null
  location_id: number | null
  description: string
  link: string
  image: string | null
  categories: string[]
  casualties: {
    deaths: number
    injuries: number
    female_deaths: number
    female_injuries: number
    child_deaths: number
    child_injuries: number
  } | null
}
export interface PaginatedIncidents {
  count: number
  limit: number
  offset: number
  results: IncidentItem[]
}
