/**
 * The Odds API Client
 * ===================
 * Fetches bookmaker odds from the-odds-api.com
 * Free tier: 500 credits/month
 *
 * Cost per request:
 * - List sports: 0 credits
 * - Get odds (h2h): 1 credit per region per sport
 * - Get odds (totals): 1 credit per region per sport
 */

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

export interface OddsApiConfig {
  apiKey: string
  regions?: string   // 'eu' | 'uk' | 'us' — default 'eu'
}

export interface BookmakerOdds {
  bookmaker: string
  bookmakerKey: string
  homeOdds: number
  drawOdds: number
  awayOdds: number
  overOdds?: number  // Over 2.5
  underOdds?: number // Under 2.5
  lastUpdate: string
}

export interface MatchOddsResult {
  externalId: string  // The Odds API event ID
  homeTeam: string
  awayTeam: string
  commenceTime: string
  bookmakers: BookmakerOdds[]
}

// football-data.org competition codes → The Odds API sport keys
const COMPETITION_MAP: Record<string, string> = {
  'BL1': 'soccer_germany_bundesliga',
  'PL': 'soccer_epl',
  'PD': 'soccer_spain_la_liga',
  'SA': 'soccer_italy_serie_a',
  'FL1': 'soccer_france_ligue_one',
  'ELC': 'soccer_england_league1',  // Championship
  'DED': 'soccer_netherlands_eredivisie',
  'PPL': 'soccer_portugal_primeira_liga',
  'CL': 'soccer_uefa_champs_league',
  'EC': 'soccer_uefa_europa_league',
}

export function getOddsSportKey(competitionCode: string): string | null {
  return COMPETITION_MAP[competitionCode] || null
}

export function getSupportedCompetitions(): string[] {
  return Object.keys(COMPETITION_MAP)
}

/**
 * Fetch h2h (1X2) odds for a specific sport/league
 */
export async function fetchOdds(
  sportKey: string,
  config: OddsApiConfig
): Promise<MatchOddsResult[]> {
  const region = config.regions || 'eu'
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${config.apiKey}&regions=${region}&markets=h2h&oddsFormat=decimal`

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    console.error(`Odds API error (${res.status}):`, text)
    return []
  }

  const creditsUsed = res.headers.get('x-requests-used')
  const creditsRemaining = res.headers.get('x-requests-remaining')
  console.log(`📊 Odds API: ${creditsUsed} credits used, ${creditsRemaining} remaining`)

  const data = await res.json()
  return parseOddsResponse(data)
}

/**
 * Fetch h2h + totals (over/under) odds
 * Costs 2 credits per call (1 for h2h + 1 for totals)
 */
export async function fetchOddsWithTotals(
  sportKey: string,
  config: OddsApiConfig
): Promise<MatchOddsResult[]> {
  const region = config.regions || 'eu'
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${config.apiKey}&regions=${region}&markets=h2h,totals&oddsFormat=decimal`

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    console.error(`Odds API error (${res.status}):`, text)
    return []
  }

  const creditsRemaining = res.headers.get('x-requests-remaining')
  console.log(`📊 Odds API: ${creditsRemaining} credits remaining`)

  const data = await res.json()
  return parseOddsResponseWithTotals(data)
}

interface OddsApiEvent {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    last_update: string
    markets: Array<{
      key: string // 'h2h' or 'totals'
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
}

function parseOddsResponse(events: OddsApiEvent[]): MatchOddsResult[] {
  return events.map(event => ({
    externalId: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    bookmakers: event.bookmakers.map(bm => {
      const h2h = bm.markets.find(m => m.key === 'h2h')
      if (!h2h) return null

      const home = h2h.outcomes.find(o => o.name === event.home_team)
      const draw = h2h.outcomes.find(o => o.name === 'Draw')
      const away = h2h.outcomes.find(o => o.name === event.away_team)

      if (!home || !draw || !away) return null

      return {
        bookmaker: bm.title,
        bookmakerKey: bm.key,
        homeOdds: home.price,
        drawOdds: draw.price,
        awayOdds: away.price,
        lastUpdate: bm.last_update,
      }
    }).filter((b): b is BookmakerOdds => b !== null),
  }))
}

function parseOddsResponseWithTotals(events: OddsApiEvent[]): MatchOddsResult[] {
  return events.map(event => ({
    externalId: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    bookmakers: event.bookmakers.map(bm => {
      const h2h = bm.markets.find(m => m.key === 'h2h')
      const totals = bm.markets.find(m => m.key === 'totals')
      if (!h2h) return null

      const home = h2h.outcomes.find(o => o.name === event.home_team)
      const draw = h2h.outcomes.find(o => o.name === 'Draw')
      const away = h2h.outcomes.find(o => o.name === event.away_team)

      if (!home || !draw || !away) return null

      // Find over/under 2.5
      let overOdds: number | undefined
      let underOdds: number | undefined
      if (totals) {
        const over = totals.outcomes.find(o => o.name === 'Over' && o.point === 2.5)
        const under = totals.outcomes.find(o => o.name === 'Under' && o.point === 2.5)
        if (over) overOdds = over.price
        if (under) underOdds = under.price
      }

      const result: BookmakerOdds = {
        bookmaker: bm.title,
        bookmakerKey: bm.key,
        homeOdds: home.price,
        drawOdds: draw.price,
        awayOdds: away.price,
        lastUpdate: bm.last_update,
      }
      if (overOdds !== undefined) result.overOdds = overOdds
      if (underOdds !== undefined) result.underOdds = underOdds
      return result
    }).filter((b): b is BookmakerOdds => b !== null),
  }))
}

// ===== TEAM NAME MATCHING =====

/**
 * Fuzzy match team names between football-data.org and The Odds API
 * The Odds API uses English names, football-data.org uses mixed
 */
const TEAM_NAME_MAP: Record<string, string[]> = {
  // Bundesliga
  'FC Bayern München': ['Bayern Munich', 'FC Bayern Munich'],
  'Borussia Dortmund': ['Borussia Dortmund', 'Dortmund'],
  'Bayer 04 Leverkusen': ['Bayer Leverkusen', 'Bayer 04 Leverkusen'],
  'RB Leipzig': ['RB Leipzig', 'Leipzig'],
  'VfB Stuttgart': ['VfB Stuttgart', 'Stuttgart'],
  'Eintracht Frankfurt': ['Eintracht Frankfurt', 'Frankfurt'],
  'VfL Wolfsburg': ['VfL Wolfsburg', 'Wolfsburg'],
  'SC Freiburg': ['SC Freiburg', 'Freiburg'],
  'TSG 1899 Hoffenheim': ['TSG Hoffenheim', 'Hoffenheim'],
  'Borussia Mönchengladbach': ['Borussia Monchengladbach', 'Gladbach', "Borussia M'gladbach"],
  '1. FC Union Berlin': ['Union Berlin', 'FC Union Berlin'],
  'SV Werder Bremen': ['Werder Bremen', 'Bremen'],
  '1. FSV Mainz 05': ['FSV Mainz 05', 'Mainz', 'Mainz 05'],
  'FC Augsburg': ['FC Augsburg', 'Augsburg'],
  '1. FC Heidenheim 1846': ['Heidenheim', 'FC Heidenheim'],
  'FC St. Pauli 1910': ['St. Pauli', 'FC St. Pauli'],
  'Holstein Kiel': ['Holstein Kiel', 'Kiel'],
  // Premier League
  'Manchester City FC': ['Manchester City', 'Man City'],
  'Arsenal FC': ['Arsenal'],
  'Liverpool FC': ['Liverpool'],
  'Manchester United FC': ['Manchester United', 'Man United'],
  'Chelsea FC': ['Chelsea'],
  'Tottenham Hotspur FC': ['Tottenham Hotspur', 'Tottenham', 'Spurs'],
  'Newcastle United FC': ['Newcastle United', 'Newcastle'],
  'Aston Villa FC': ['Aston Villa'],
  'Brighton & Hove Albion FC': ['Brighton and Hove Albion', 'Brighton'],
  'West Ham United FC': ['West Ham United', 'West Ham'],
  // La Liga
  'FC Barcelona': ['Barcelona'],
  'Real Madrid CF': ['Real Madrid'],
  'Club Atlético de Madrid': ['Atletico Madrid'],
  // Serie A
  'FC Internazionale Milano': ['Inter Milan', 'Inter'],
  'AC Milan': ['AC Milan', 'Milan'],
  'Juventus FC': ['Juventus'],
  'SSC Napoli': ['Napoli'],
  'AS Roma': ['AS Roma', 'Roma'],
}

/**
 * Match a football-data.org team name to an Odds API team name
 */
export function matchTeamName(
  fdTeamName: string,
  oddsTeamNames: string[]
): string | null {
  // Direct match
  if (oddsTeamNames.includes(fdTeamName)) return fdTeamName

  // Check mapping
  const aliases = TEAM_NAME_MAP[fdTeamName]
  if (aliases) {
    for (const alias of aliases) {
      const found = oddsTeamNames.find(
        n => n.toLowerCase() === alias.toLowerCase()
      )
      if (found) return found
    }
  }

  // Fuzzy: check if one contains the other
  const fdLower = fdTeamName.toLowerCase()
  for (const oddsName of oddsTeamNames) {
    const oddsLower = oddsName.toLowerCase()
    if (fdLower.includes(oddsLower) || oddsLower.includes(fdLower)) {
      return oddsName
    }
  }

  // Last resort: check words overlap
  const fdWords = fdLower.split(/\s+/).filter(w => w.length > 2)
  for (const oddsName of oddsTeamNames) {
    const oddsWords = oddsName.toLowerCase().split(/\s+/)
    const overlap = fdWords.filter(w => oddsWords.includes(w))
    if (overlap.length >= 1 && overlap.some(w => w.length > 3)) {
      return oddsName
    }
  }

  return null
}
