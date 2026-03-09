/**
 * Football Data API v4 Client
 * Free tier: 10 requests/minute
 * Docs: https://docs.football-data.org/general/v4/index.html
 */

const API_BASE = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''

// Top European Leagues we support
export const SUPPORTED_LEAGUES = [
  { code: 'BL1', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪' },
  { code: 'PL',  name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
  { code: 'SA',  name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
  { code: 'CL',  name: 'Champions League', country: 'Europe', flag: '🏆' },
  { code: 'ELC', name: 'Championship', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PPL', name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹' },
  { code: 'DED', name: 'Eredivisie', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'EC',  name: 'Europa League', country: 'Europe', flag: '🏆' },
] as const

export type LeagueCode = typeof SUPPORTED_LEAGUES[number]['code']

interface ApiResponse<T> {
  data: T | null
  error: string | null
  rateLimited: boolean
}

async function apiRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds in Next.js
    })

    if (res.status === 429) {
      return { data: null, error: 'Rate limited', rateLimited: true }
    }

    if (!res.ok) {
      const text = await res.text()
      return { data: null, error: `API Error ${res.status}: ${text}`, rateLimited: false }
    }

    const data = await res.json()
    return { data: data as T, error: null, rateLimited: false }
  } catch (err) {
    return { data: null, error: `Fetch error: ${err}`, rateLimited: false }
  }
}

// ===== TYPES =====

export interface Competition {
  id: number
  name: string
  code: string
  type: string
  emblem: string
  area: {
    id: number
    name: string
    code: string
    flag: string
  }
  currentSeason: {
    id: number
    startDate: string
    endDate: string
    currentMatchday: number
  }
}

export interface Team {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
  address: string
  website: string
  founded: number
  clubColors: string
  venue: string
}

export interface Match {
  id: number
  competition: {
    id: number
    name: string
    code: string
    emblem: string
  }
  season: {
    id: number
    startDate: string
    endDate: string
    currentMatchday: number
  }
  utcDate: string
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED'
  matchday: number
  stage: string
  group: string | null
  homeTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
  goals?: Goal[]
  referees?: Array<{
    id: number
    name: string
    type: string
  }>
}

export interface Goal {
  minute: number
  injuryTime: number | null
  type: 'REGULAR' | 'OWN' | 'PENALTY'
  team: {
    id: number
    name: string
  }
  scorer: {
    id: number
    name: string
  }
  assist: {
    id: number
    name: string
  } | null
  score: {
    home: number
    away: number
  }
}

export interface Standing {
  stage: string
  type: string
  table: Array<{
    position: number
    team: {
      id: number
      name: string
      shortName: string
      tla: string
      crest: string
    }
    playedGames: number
    form: string | null
    won: number
    draw: number
    lost: number
    points: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
  }>
}

// ===== API FUNCTIONS =====

/** Get all teams from a competition */
export async function getTeamsByCompetition(code: string) {
  return apiRequest<{ teams: Team[] }>(`/competitions/${code}/teams`)
}

/** Get a single competition */
export async function getCompetition(code: string) {
  return apiRequest<Competition>(`/competitions/${code}`)
}

/** Get matches for a competition (optionally filter by matchday or status) */
export async function getCompetitionMatches(code: string, filters?: {
  matchday?: number
  status?: string
  dateFrom?: string
  dateTo?: string
}) {
  let endpoint = `/competitions/${code}/matches`
  const params = new URLSearchParams()
  if (filters?.matchday) params.set('matchday', String(filters.matchday))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.set('dateTo', filters.dateTo)
  if (params.toString()) endpoint += `?${params}`
  return apiRequest<{ matches: Match[] }>(endpoint)
}

/** Get all live matches across all competitions */
export async function getLiveMatches() {
  return apiRequest<{ matches: Match[] }>('/matches?status=LIVE')
}

/** Get today's matches */
export async function getTodayMatches() {
  const today = new Date().toISOString().split('T')[0]
  return apiRequest<{ matches: Match[] }>(`/matches?dateFrom=${today}&dateTo=${today}`)
}

/** Get upcoming matches for a specific team */
export async function getTeamMatches(teamId: number, filters?: {
  status?: string
  limit?: number
  dateFrom?: string
  dateTo?: string
}) {
  let endpoint = `/teams/${teamId}/matches`
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.set('dateTo', filters.dateTo)
  if (params.toString()) endpoint += `?${params}`
  return apiRequest<{ matches: Match[] }>(endpoint)
}

/** Get a single match with full details including goals */
export async function getMatch(matchId: number) {
  return apiRequest<Match>(`/matches/${matchId}`)
}

/** Get standings for a competition */
export async function getStandings(code: string) {
  return apiRequest<{ standings: Standing[] }>(`/competitions/${code}/standings`)
}

/** Get matches for the next N days for specific team IDs */
export async function getUpcomingMatchesForTeams(teamIds: number[], days: number = 7) {
  const dateFrom = new Date().toISOString().split('T')[0]
  const dateTo = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  // We can't filter by multiple teams in one call, so we fetch all matches within date range
  // and filter client-side. This uses only 1 API request.
  const result = await apiRequest<{ matches: Match[] }>(
    `/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
  )
  
  if (result.data) {
    result.data.matches = result.data.matches.filter(m => 
      teamIds.includes(m.homeTeam.id) || teamIds.includes(m.awayTeam.id)
    )
  }
  
  return result
}
