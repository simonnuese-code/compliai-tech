/**
 * Value Bet Model — Poisson-based match prediction
 * =================================================
 * Uses attack/defense strengths + league averages to predict
 * match outcomes via independent Poisson distributions.
 *
 * EV = (trueProb × decimalOdds) - 1
 * Kelly = (EV) / (odds - 1)  [fractional]
 */

// ===== POISSON MATH =====

/** Factorial with memoization (for goals 0-10) */
const factCache: number[] = [1]
function factorial(n: number): number {
  if (n < 0) return 1
  if (factCache[n] !== undefined) return factCache[n]
  factCache[n] = n * factorial(n - 1)
  return factCache[n]
}

/** Poisson probability: P(X = k) = (λ^k × e^-λ) / k! */
export function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

// ===== EXPECTED GOALS =====

export interface TeamStrength {
  attackStrength: number  // relative to league avg (1.0 = average)
  defenseStrength: number // relative to league avg (1.0 = average)
  homeAttackStrength: number  // home goals scored / league avg home goals
  homeDefenseStrength: number // home goals conceded / league avg away goals
  awayAttackStrength: number  // away goals scored / league avg away goals
  awayDefenseStrength: number // away goals conceded / league avg home goals
  formAttack: number      // recent form factor
  formDefense: number     // recent form factor
}

export interface LeagueAverages {
  avgHomeGoals: number // e.g. 1.55 for Bundesliga
  avgAwayGoals: number // e.g. 1.25 for Bundesliga
}

// Default league averages (Bundesliga-ish)
export const DEFAULT_LEAGUE_AVG: LeagueAverages = {
  avgHomeGoals: 1.55,
  avgAwayGoals: 1.25,
}

// Form weight — how much recent form influences prediction (0-1)
const FORM_WEIGHT = 0.3

/**
 * Calculate expected goals for a match
 * xG_home = homeAttack × awayDefense × leagueAvgHomeGoals
 * xG_away = awayAttack × homeDefense × leagueAvgAwayGoals
 */
export function calculateExpectedGoals(
  home: TeamStrength,
  away: TeamStrength,
  league: LeagueAverages = DEFAULT_LEAGUE_AVG
): { homeXG: number; awayXG: number } {
  // Blend season strength with form
  const homeAtk = home.attackStrength * (1 - FORM_WEIGHT) + home.formAttack * FORM_WEIGHT
  const homeDef = home.defenseStrength * (1 - FORM_WEIGHT) + home.formDefense * FORM_WEIGHT
  const awayAtk = away.attackStrength * (1 - FORM_WEIGHT) + away.formAttack * FORM_WEIGHT
  const awayDef = away.defenseStrength * (1 - FORM_WEIGHT) + away.formDefense * FORM_WEIGHT

  const homeXG = homeAtk * awayDef * league.avgHomeGoals
  const awayXG = awayAtk * homeDef * league.avgAwayGoals

  // Clamp to reasonable range
  return {
    homeXG: Math.max(0.2, Math.min(5.0, homeXG)),
    awayXG: Math.max(0.2, Math.min(5.0, awayXG)),
  }
}

// ===== MATCH OUTCOME PROBABILITIES =====

export interface MatchProbabilities {
  homeWin: number
  draw: number
  awayWin: number
  over25: number
  under25: number
  expectedHomeGoals: number
  expectedAwayGoals: number
  // Score matrix (for detailed analysis)
  scoreMatrix: number[][]
}

const MAX_GOALS = 8 // Calculate up to 8 goals per team

/**
 * Generate full probability matrix using Poisson model
 */
export function predictMatch(
  home: TeamStrength,
  away: TeamStrength,
  league: LeagueAverages = DEFAULT_LEAGUE_AVG
): MatchProbabilities {
  const { homeXG, awayXG } = calculateExpectedGoals(home, away, league)

  // Build score probability matrix
  const matrix: number[][] = []
  let homeWin = 0
  let draw = 0
  let awayWin = 0
  let over25 = 0

  for (let h = 0; h <= MAX_GOALS; h++) {
    matrix[h] = []
    for (let a = 0; a <= MAX_GOALS; a++) {
      const prob = poissonPmf(homeXG, h) * poissonPmf(awayXG, a)
      matrix[h][a] = prob

      if (h > a) homeWin += prob
      else if (h === a) draw += prob
      else awayWin += prob

      if (h + a > 2) over25 += prob
    }
  }

  return {
    homeWin,
    draw,
    awayWin,
    over25,
    under25: 1 - over25,
    expectedHomeGoals: homeXG,
    expectedAwayGoals: awayXG,
    scoreMatrix: matrix,
  }
}

// ===== VALUE BET DETECTION =====

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
  ev: number         // Expected value (positive = value bet)
  kellyStake: number // Kelly criterion stake (fractional)
  confidence: number // Model confidence 0-1
}

/**
 * Expected Value: EV = (trueProb × odds) - 1
 * Positive EV = profitable in the long run
 */
export function calculateEV(trueProb: number, decimalOdds: number): number {
  return (trueProb * decimalOdds) - 1
}

/**
 * Kelly Criterion (fractional):
 * f* = (p × (b + 1) - 1) / b × fraction
 * where p = true probability, b = decimal odds - 1
 */
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

/**
 * Find value bets across all bookmakers for a match
 */
export function findValueBets(
  prediction: MatchProbabilities,
  odds: OddsLine[],
  minEV: number = 0.05,
  kellyFraction: number = 0.25
): ValueBet[] {
  const valueBets: ValueBet[] = []

  // Calculate model confidence based on how extreme probabilities are
  // More decisive predictions = higher confidence
  const maxProb = Math.max(prediction.homeWin, prediction.draw, prediction.awayWin)
  const confidence = Math.min(0.95, 0.3 + maxProb * 0.6)

  for (const line of odds) {
    const markets: Array<{
      market: ValueBet['market']
      prob: number
      odds: number
    }> = [
      { market: 'home', prob: prediction.homeWin, odds: line.homeOdds },
      { market: 'draw', prob: prediction.draw, odds: line.drawOdds },
      { market: 'away', prob: prediction.awayWin, odds: line.awayOdds },
    ]

    if (line.overOdds) {
      markets.push({ market: 'over25', prob: prediction.over25, odds: line.overOdds })
    }
    if (line.underOdds) {
      markets.push({ market: 'under25', prob: prediction.under25, odds: line.underOdds })
    }

    for (const m of markets) {
      if (m.odds <= 1.0) continue
      const ev = calculateEV(m.prob, m.odds)
      if (ev >= minEV) {
        valueBets.push({
          market: m.market,
          trueProb: m.prob,
          odds: m.odds,
          bookmaker: line.bookmaker,
          ev,
          kellyStake: kellyStake(m.prob, m.odds, kellyFraction),
          confidence,
        })
      }
    }
  }

  // Sort by EV descending
  return valueBets.sort((a, b) => b.ev - a.ev)
}

// ===== BRIER SCORE (MODEL ACCURACY) =====

/**
 * Brier Score: measures prediction accuracy
 * BS = Σ (predicted_i - actual_i)² / N
 * Lower = better (0 = perfect, 1 = worst)
 */
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

// ===== TEAM STATS CALCULATION =====

/**
 * Calculate attack/defense strength from raw stats
 * Attack = (team goals scored / matches) / league avg goals scored
 * Defense = (team goals conceded / matches) / league avg goals conceded
 */
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

// ===== FORMATTING HELPERS =====

export function formatMarketName(market: string): string {
  const names: Record<string, string> = {
    home: 'Heimsieg',
    draw: 'Unentschieden',
    away: 'Auswärtssieg',
    over25: 'Über 2.5 Tore',
    under25: 'Unter 2.5 Tore',
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
