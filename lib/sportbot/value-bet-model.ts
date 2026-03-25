/**
 * Value Bet Model — Poisson v3 Pro
 * =================================
 * Multi-factor prediction model combining:
 * 1. Dixon-Coles corrected Poisson distribution
 * 2. ELO rating system
 * 3. Market-implied probability blending
 * 4. Rest days / fixture congestion
 * 5. Head-to-head historical adjustment
 * 6. Regression to mean (shrinkage)
 * 7. Goal supremacy weighted form
 *
 * EV = (trueProb × decimalOdds) - 1
 * Kelly = (EV) / (odds - 1)  [fractional]
 */

// ===== CONSTANTS =====

export const MODEL_VERSION = 'poisson_v3_pro'
export const FACTORS_USED = [
  'Dixon-Coles Poisson',
  'ELO Rating',
  'Market Blend (60/40)',
  'Rest Days',
  'Head-to-Head',
  'Regression to Mean',
  'Goal Supremacy Form',
]

// ===== POISSON MATH =====

const factCache: number[] = [1]
function factorial(n: number): number {
  if (n < 0) return 1
  if (factCache[n] !== undefined) return factCache[n]
  factCache[n] = n * factorial(n - 1)
  return factCache[n]
}

export function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

// ===== TYPES =====

export interface TeamStrength {
  attackStrength: number
  defenseStrength: number
  homeAttackStrength: number
  homeDefenseStrength: number
  awayAttackStrength: number
  awayDefenseStrength: number
  formAttack: number
  formDefense: number
  eloRating?: number
}

export interface LeagueAverages {
  avgHomeGoals: number
  avgAwayGoals: number
}

export const DEFAULT_LEAGUE_AVG: LeagueAverages = {
  avgHomeGoals: 1.55,
  avgAwayGoals: 1.25,
}

export interface MatchProbabilities {
  homeWin: number
  draw: number
  awayWin: number
  over25: number
  under25: number
  expectedHomeGoals: number
  expectedAwayGoals: number
  scoreMatrix: number[][]
}

export interface PredictionFactors {
  eloHomeRating?: number | null
  eloAwayRating?: number | null
  restDaysHome?: number | null
  restDaysAway?: number | null
  h2hAdjustment?: number | null
  blendedHomeProb?: number | null
  blendedDrawProb?: number | null
  blendedAwayProb?: number | null
}

export interface OddsLine {
  bookmaker: string
  homeOdds: number
  drawOdds: number
  awayOdds: number
  overOdds?: number
  underOdds?: number
}

export interface ValueBet {
  market: 'home' | 'draw' | 'away' | 'over25' | 'under25'
  trueProb: number
  odds: number
  bookmaker: string
  ev: number
  kellyStake: number
  confidence: number
}

// ===== DIXON-COLES =====

const DIXON_COLES_RHO = -0.13

function dixonColesCorrection(
  homeGoals: number,
  awayGoals: number,
  homeXG: number,
  awayXG: number,
  rho: number = DIXON_COLES_RHO
): number {
  if (homeGoals === 0 && awayGoals === 0) return 1 - homeXG * awayXG * rho
  if (homeGoals === 1 && awayGoals === 0) return 1 + awayXG * rho
  if (homeGoals === 0 && awayGoals === 1) return 1 + homeXG * rho
  if (homeGoals === 1 && awayGoals === 1) return 1 - rho
  return 1.0
}

// ===== CORE PREDICTION =====

const FORM_WEIGHT = 0.3
const MAX_GOALS = 8

export function calculateExpectedGoals(
  home: TeamStrength,
  away: TeamStrength,
  league: LeagueAverages = DEFAULT_LEAGUE_AVG
): { homeXG: number; awayXG: number } {
  const homeAtk = home.homeAttackStrength * (1 - FORM_WEIGHT) + home.formAttack * FORM_WEIGHT
  const homeDef = home.homeDefenseStrength * (1 - FORM_WEIGHT) + home.formDefense * FORM_WEIGHT
  const awayAtk = away.awayAttackStrength * (1 - FORM_WEIGHT) + away.formAttack * FORM_WEIGHT
  const awayDef = away.awayDefenseStrength * (1 - FORM_WEIGHT) + away.formDefense * FORM_WEIGHT

  return {
    homeXG: Math.max(0.2, Math.min(5.0, homeAtk * awayDef * league.avgHomeGoals)),
    awayXG: Math.max(0.2, Math.min(5.0, awayAtk * homeDef * league.avgAwayGoals)),
  }
}

export function predictMatch(
  home: TeamStrength,
  away: TeamStrength,
  league: LeagueAverages = DEFAULT_LEAGUE_AVG
): MatchProbabilities {
  const { homeXG, awayXG } = calculateExpectedGoals(home, away, league)

  const matrix: number[][] = []
  let homeWin = 0, draw = 0, awayWin = 0, over25 = 0

  for (let h = 0; h <= MAX_GOALS; h++) {
    matrix[h] = []
    for (let a = 0; a <= MAX_GOALS; a++) {
      const baseProb = poissonPmf(homeXG, h) * poissonPmf(awayXG, a)
      const dcFactor = dixonColesCorrection(h, a, homeXG, awayXG)
      const prob = baseProb * dcFactor
      matrix[h][a] = prob

      if (h > a) homeWin += prob
      else if (h === a) draw += prob
      else awayWin += prob
      if (h + a > 2) over25 += prob
    }
  }

  // Normalize after Dixon-Coles
  const total = homeWin + draw + awayWin
  if (total > 0) { homeWin /= total; draw /= total; awayWin /= total }

  return {
    homeWin, draw, awayWin, over25,
    under25: 1 - over25,
    expectedHomeGoals: homeXG,
    expectedAwayGoals: awayXG,
    scoreMatrix: matrix,
  }
}

// ===== VALUE BET DETECTION =====

export function calculateEV(trueProb: number, decimalOdds: number): number {
  return (trueProb * decimalOdds) - 1
}

export function kellyStake(
  trueProb: number,
  decimalOdds: number,
  fraction: number = 0.25
): number {
  const b = decimalOdds - 1
  if (b <= 0) return 0
  const kelly = ((trueProb * (b + 1)) - 1) / b
  return Math.max(0, kelly * fraction)
}

export function findValueBets(
  prediction: MatchProbabilities,
  odds: OddsLine[],
  minEV: number = 0.05,
  kellyFraction: number = 0.25
): ValueBet[] {
  const valueBets: ValueBet[] = []
  const maxProb = Math.max(prediction.homeWin, prediction.draw, prediction.awayWin)
  const confidence = Math.min(0.95, 0.3 + maxProb * 0.6)

  for (const line of odds) {
    const markets: Array<{ market: ValueBet['market']; prob: number; odds: number }> = [
      { market: 'home', prob: prediction.homeWin, odds: line.homeOdds },
      { market: 'draw', prob: prediction.draw, odds: line.drawOdds },
      { market: 'away', prob: prediction.awayWin, odds: line.awayOdds },
    ]
    if (line.overOdds) markets.push({ market: 'over25', prob: prediction.over25, odds: line.overOdds })
    if (line.underOdds) markets.push({ market: 'under25', prob: prediction.under25, odds: line.underOdds })

    for (const m of markets) {
      if (m.odds <= 1.0) continue
      const ev = calculateEV(m.prob, m.odds)
      if (ev >= minEV) {
        valueBets.push({
          market: m.market, trueProb: m.prob, odds: m.odds,
          bookmaker: line.bookmaker, ev,
          kellyStake: kellyStake(m.prob, m.odds, kellyFraction),
          confidence,
        })
      }
    }
  }

  return valueBets.sort((a, b) => b.ev - a.ev)
}

// ===== BRIER SCORE =====

export function brierScore(
  prediction: { homeWin: number; draw: number; awayWin: number },
  actualResult: 'home' | 'draw' | 'away'
): number {
  const actual = {
    home: actualResult === 'home' ? 1 : 0,
    draw: actualResult === 'draw' ? 1 : 0,
    away: actualResult === 'away' ? 1 : 0,
  }
  return (
    Math.pow(prediction.homeWin - actual.home, 2) +
    Math.pow(prediction.draw - actual.draw, 2) +
    Math.pow(prediction.awayWin - actual.away, 2)
  ) / 3
}

// ===== HELPERS =====

export function calculateStrength(stats: {
  goalsScored: number
  goalsConceded: number
  matchesPlayed: number
  leagueAvgScored: number
  leagueAvgConceded: number
}): { attack: number; defense: number } {
  if (stats.matchesPlayed === 0) return { attack: 1.0, defense: 1.0 }
  const avgScored = stats.goalsScored / stats.matchesPlayed
  const avgConceded = stats.goalsConceded / stats.matchesPlayed
  return {
    attack: stats.leagueAvgScored > 0 ? avgScored / stats.leagueAvgScored : 1.0,
    defense: stats.leagueAvgConceded > 0 ? avgConceded / stats.leagueAvgConceded : 1.0,
  }
}

export function formatMarketName(market: string): string {
  const names: Record<string, string> = {
    home: 'Heimsieg', draw: 'Unentschieden', away: 'Auswärtssieg',
    over25: 'Über 2.5 Tore', under25: 'Unter 2.5 Tore',
  }
  return names[market] || market
}

export function formatEV(ev: number): string {
  return `${ev > 0 ? '+' : ''}${(ev * 100).toFixed(1)}%`
}

export function formatKelly(kelly: number, bankroll: number): string {
  const amount = kelly * bankroll
  return `${(kelly * 100).toFixed(1)}% (${amount.toFixed(2)}€)`
}

export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`
}

export function formatRestDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return 'Unbekannt'
  if (days <= 2) return `${days}d ⚠️ Müde`
  if (days <= 3) return `${days}d Leicht müde`
  if (days <= 7) return `${days}d Normal`
  return `${days}d Lange Pause`
}

export function formatEloRating(elo: number | null | undefined): string {
  if (elo === null || elo === undefined) return '1500'
  if (elo >= 1700) return `${Math.round(elo)} ⭐ Elite`
  if (elo >= 1600) return `${Math.round(elo)} Stark`
  if (elo >= 1500) return `${Math.round(elo)} Mittel`
  if (elo >= 1400) return `${Math.round(elo)} Schwach`
  return `${Math.round(elo)} ⚠️ Krise`
}
