/**
 * CompliAI Sport-Bot Worker
 * ========================
 * Runs on Hetzner server as a systemd service.
 * - Polls football-data.org for live matches every 30 seconds
 * - Detects goals, cards, penalties, kickoff, halftime, fulltime
 * - Sends WhatsApp notifications via WAHA
 * - Shares the Neon PostgreSQL database with the Vercel frontend
 */

const { PrismaClient } = require('@prisma/client')

const DATABASE_URL = process.env.DATABASE_URL
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3001'
const WAHA_API_KEY = process.env.WAHA_API_KEY || ''
const ODDS_API_KEY = process.env.ODDS_API_KEY || ''
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4'
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

const prisma = new PrismaClient()

// ===== FOOTBALL API =====

async function footballApi(endpoint) {
  const res = await fetch(`${FOOTBALL_API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
  })
  if (res.status === 429) {
    console.warn('⚠️ Rate limited! Waiting 60s...')
    await sleep(60000)
    return null
  }
  if (!res.ok) {
    console.error(`API Error ${res.status}: ${await res.text()}`)
    return null
  }
  return res.json()
}

// ===== WHATSAPP =====

async function sendWhatsApp(sessionName, phoneNumber, message) {
  try {
    const res = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY,
      },
      body: JSON.stringify({
        session: sessionName,
        chatId: `${phoneNumber}@c.us`,
        text: message,
      }),
    })
    if (res.ok) {
      console.log(`📱 WhatsApp sent to +${phoneNumber}`)
      return true
    } else {
      console.error(`📱 WhatsApp send failed: ${res.status} ${await res.text()}`)
      return false
    }
  } catch (err) {
    console.error('📱 WhatsApp error:', err.message)
    return false
  }
}

// ===== NOTIFICATION ENGINE =====

async function sendNotification(userId, matchExternalId, eventKey, message) {
  // Check if already sent (deduplication)
  const existing = await prisma.sentNotification.findUnique({
    where: { userId_eventKey: { userId, eventKey } },
  })
  if (existing) return false

  // Check user settings first
  const settings = await prisma.sportBotSettings.findUnique({
    where: { userId },
  })
  if (settings && !settings.notificationsEnabled) return false

  // Check quiet hours
  if (settings?.quietHoursStart && settings?.quietHoursEnd) {
    const now = new Date()
    const tz = settings.timezone || 'Europe/Berlin'
    const currentTime = now.toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
    const start = settings.quietHoursStart
    const end = settings.quietHoursEnd
    if (start > end) {
      if (currentTime >= start || currentTime < end) return false
    } else {
      if (currentTime >= start && currentTime < end) return false
    }
  }

  // Get user's WhatsApp session
  const waSession = await prisma.whatsAppSession.findUnique({
    where: { userId },
  })

  if (!waSession || waSession.status !== 'CONNECTED' || !waSession.phoneNumber) {
    // Don't log — WhatsApp not connected, event should be retried next loop
    return false
  }

  // Send the message
  const sent = await sendWhatsApp(waSession.sessionName, waSession.phoneNumber, message)
  if (!sent) return false

  // Only log after successful send (deduplication)
  await prisma.sentNotification.create({
    data: {
      userId,
      matchExternalId,
      eventKey,
      channel: 'whatsapp',
      messageText: message,
    },
  })

  return true
}

// ===== MATCH PROCESSING =====

async function processMatch(match, followedTeamIds, userMap) {
  const homeTeamId = match.homeTeam.id
  const awayTeamId = match.awayTeam.id
  const matchId = match.id

  // Find users who follow either team
  const relevantUsers = []
  for (const [userId, teamIds] of Object.entries(userMap)) {
    if (teamIds.includes(homeTeamId) || teamIds.includes(awayTeamId)) {
      relevantUsers.push(userId)
    }
  }

  if (relevantUsers.length === 0) return

  const homeName = match.homeTeam.shortName || match.homeTeam.name
  const awayName = match.awayTeam.shortName || match.awayTeam.name
  const competition = match.competition?.name || ''
  const homeScore = match.score?.fullTime?.home ?? 0
  const awayScore = match.score?.fullTime?.away ?? 0

  // Upsert match in DB
  const existingMatch = await prisma.sportMatch.findUnique({
    where: { externalId: matchId },
  })

  const previousStatus = existingMatch?.status
  const previousHomeScore = existingMatch?.homeScoreFullTime
  const previousAwayScore = existingMatch?.awayScoreFullTime

  await prisma.sportMatch.upsert({
    where: { externalId: matchId },
    update: {
      status: match.status,
      homeScoreFullTime: match.score?.fullTime?.home,
      awayScoreFullTime: match.score?.fullTime?.away,
      homeScoreHalfTime: match.score?.halfTime?.home,
      awayScoreHalfTime: match.score?.halfTime?.away,
      minute: match.minute || null,
      lastUpdatedAt: new Date(),
    },
    create: {
      externalId: matchId,
      competitionCode: match.competition?.code || '',
      competitionName: competition,
      competitionEmblem: match.competition?.emblem,
      matchday: match.matchday,
      stage: match.stage,
      homeTeamId,
      homeTeamName: match.homeTeam.name,
      homeTeamCrest: match.homeTeam.crest,
      awayTeamId,
      awayTeamName: match.awayTeam.name,
      awayTeamCrest: match.awayTeam.crest,
      status: match.status,
      homeScoreFullTime: match.score?.fullTime?.home,
      awayScoreFullTime: match.score?.fullTime?.away,
      homeScoreHalfTime: match.score?.halfTime?.home,
      awayScoreHalfTime: match.score?.halfTime?.away,
      utcDate: new Date(match.utcDate),
      minute: match.minute || null,
    },
  })

  // === DETECT EVENTS ===

  for (const userId of relevantUsers) {
    // 1. KICKOFF
    if (match.status === 'IN_PLAY' && previousStatus !== 'IN_PLAY' && previousStatus !== 'PAUSED') {
      const msg = `⚽ ANPFIFF!\n\n${homeName} vs ${awayName}\n🏆 ${competition}`
      await sendNotification(userId, matchId, `match_${matchId}_kickoff`, msg)
    }

    // 2. HALFTIME
    if (match.status === 'PAUSED' && previousStatus === 'IN_PLAY') {
      const msg = `⏸️ HALBZEIT\n\n${homeName} ${homeScore} : ${awayScore} ${awayName}\n🏆 ${competition}`
      await sendNotification(userId, matchId, `match_${matchId}_halftime`, msg)
    }

    // 3. FULLTIME
    if (match.status === 'FINISHED' && previousStatus !== 'FINISHED') {
      let emoji = '🏁'
      if (homeScore > awayScore) emoji = '🎉'
      else if (awayScore > homeScore) emoji = '🎉'
      const msg = `${emoji} ABPFIFF!\n\n${homeName} ${homeScore} : ${awayScore} ${awayName}\n🏆 ${competition}`
      await sendNotification(userId, matchId, `match_${matchId}_fulltime`, msg)
    }

    // 4. GOALS (score changed)
    if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
      if (previousHomeScore !== null && previousAwayScore !== null) {
        if (homeScore > previousHomeScore) {
          // Home team scored
          const goalInfo = getGoalInfo(match, homeTeamId, homeScore + awayScore)
          const msg = `⚽ TOOOOR!\n\n${homeName} ${homeScore} : ${awayScore} ${awayName}\n${goalInfo}\n🏆 ${competition}`
          await sendNotification(userId, matchId, `match_${matchId}_goal_${homeScore}_${awayScore}`, msg)
        }
        if (awayScore > previousAwayScore) {
          // Away team scored
          const goalInfo = getGoalInfo(match, awayTeamId, homeScore + awayScore)
          const msg = `⚽ TOOOOR!\n\n${homeName} ${homeScore} : ${awayScore} ${awayName}\n${goalInfo}\n🏆 ${competition}`
          await sendNotification(userId, matchId, `match_${matchId}_goal_${homeScore}_${awayScore}`, msg)
        }
      }
    }
  }

  // Process explicit goals from API if available
  if (match.goals && match.goals.length > 0) {
    for (const goal of match.goals) {
      const eventKey = `match_${matchId}_goal_${goal.minute}_${goal.scorer?.name || 'unknown'}`
      const type = goal.type === 'OWN' ? '🔴 Eigentor' : goal.type === 'PENALTY' ? '🎯 Elfmeter' : '⚽'
      const scorer = goal.scorer?.name || 'Unbekannt'
      const assist = goal.assist?.name ? ` (Vorlage: ${goal.assist.name})` : ''
      const score = `${goal.score.home} : ${goal.score.away}`

      // Save event
      try {
        await prisma.matchEvent.upsert({
          where: {
            matchId_eventType_minute_playerName: {
              matchId: existingMatch?.id || '',
              eventType: goal.type === 'OWN' ? 'OWN_GOAL' : goal.type === 'PENALTY' ? 'PENALTY_SCORED' : 'GOAL',
              minute: goal.minute,
              playerName: scorer,
            },
          },
          update: {},
          create: {
            matchId: existingMatch?.id || (await prisma.sportMatch.findUnique({ where: { externalId: matchId } }))?.id || '',
            eventType: goal.type === 'OWN' ? 'OWN_GOAL' : goal.type === 'PENALTY' ? 'PENALTY_SCORED' : 'GOAL',
            minute: goal.minute,
            teamId: goal.team?.id,
            teamName: goal.team?.name,
            playerName: scorer,
            detail: `${type} ${scorer}${assist}`,
            homeScore: goal.score.home,
            awayScore: goal.score.away,
          },
        })
      } catch (e) {
        // Ignore duplicate entry errors
      }
    }
  }
}

function getGoalInfo(match, teamId, totalGoals) {
  if (match.goals) {
    const latestGoal = match.goals.find(g => g.score.home + g.score.away === totalGoals)
    if (latestGoal) {
      const type = latestGoal.type === 'OWN' ? '🔴 Eigentor' : latestGoal.type === 'PENALTY' ? '🎯 Elfmeter' : ''
      return `${latestGoal.scorer?.name || ''} ${latestGoal.minute}' ${type}`
    }
  }
  return ''
}

// ===== PRE-MATCH NOTIFICATIONS =====

async function checkPreMatchNotifications() {
  // Get all users with their settings and followed teams
  const users = await prisma.sportBotSettings.findMany({
    where: { notificationsEnabled: true },
    include: {
      user: {
        include: {
          followedTeams: true,
          whatsappSession: true,
        },
      },
    },
  })

  for (const settings of users) {
    if (!settings.user.whatsappSession || settings.user.whatsappSession.status !== 'CONNECTED') continue

    const teamIds = settings.user.followedTeams.map(t => t.teamId)
    if (teamIds.length === 0) continue

    const preMatchMs = (settings.preMatchMinutes || 15) * 60 * 1000
    const now = Date.now()
    const checkWindow = now + preMatchMs + 60000 // +1 min buffer

    // Find upcoming matches starting soon
    const upcomingMatches = await prisma.sportMatch.findMany({
      where: {
        status: { in: ['SCHEDULED', 'TIMED'] },
        utcDate: {
          gte: new Date(now),
          lte: new Date(checkWindow),
        },
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
    })

    for (const match of upcomingMatches) {
      const minutesUntil = Math.round((new Date(match.utcDate).getTime() - now) / 60000)
      if (minutesUntil <= settings.preMatchMinutes && minutesUntil > 0) {
        const eventKey = `match_${match.externalId}_prematch_${settings.preMatchMinutes}`
        const msg = `📢 GLEICH GEHT'S LOS!\n\n${match.homeTeamName} vs ${match.awayTeamName}\n⏰ In ${minutesUntil} Minuten\n🏆 ${match.competitionName}`
        await sendNotification(settings.userId, match.externalId, eventKey, msg)
      }
    }
  }
}

// ===== SCHEDULE SYNC =====

async function syncUpcomingMatches() {
  console.log('📅 Syncing upcoming matches...')

  // Get all unique team IDs being followed
  const allFollowed = await prisma.followedTeam.findMany({
    select: { teamId: true },
    distinct: ['teamId'],
  })

  if (allFollowed.length === 0) {
    console.log('📅 No teams followed, skipping sync')
    return
  }

  const teamIds = new Set(allFollowed.map(t => t.teamId))

  // Fetch matches for next 14 days (wider window to catch international breaks)
  const dateFrom = new Date().toISOString().split('T')[0]
  const dateTo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const data = await footballApi(`/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`)
  if (!data) return

  const relevantMatches = (data.matches || []).filter(m =>
    teamIds.has(m.homeTeam.id) || teamIds.has(m.awayTeam.id)
  )

  console.log(`📅 Found ${relevantMatches.length} relevant matches`)

  for (const match of relevantMatches) {
    await prisma.sportMatch.upsert({
      where: { externalId: match.id },
      update: {
        status: match.status,
        utcDate: new Date(match.utcDate),
        homeScoreFullTime: match.score?.fullTime?.home,
        awayScoreFullTime: match.score?.fullTime?.away,
        matchday: match.matchday,
        lastUpdatedAt: new Date(),
      },
      create: {
        externalId: match.id,
        competitionCode: match.competition?.code || '',
        competitionName: match.competition?.name || '',
        competitionEmblem: match.competition?.emblem,
        matchday: match.matchday,
        stage: match.stage,
        homeTeamId: match.homeTeam.id,
        homeTeamName: match.homeTeam.name,
        homeTeamCrest: match.homeTeam.crest,
        awayTeamId: match.awayTeam.id,
        awayTeamName: match.awayTeam.name,
        awayTeamCrest: match.awayTeam.crest,
        status: match.status,
        utcDate: new Date(match.utcDate),
        homeScoreFullTime: match.score?.fullTime?.home,
        awayScoreFullTime: match.score?.fullTime?.away,
      },
    })
  }

  console.log(`📅 Synced ${relevantMatches.length} upcoming matches`)

  // Also sync past results (last 7 days) so the website can show them
  const pastFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const pastTo = new Date().toISOString().split('T')[0]

  const pastData = await footballApi(`/matches?dateFrom=${pastFrom}&dateTo=${pastTo}&status=FINISHED`)
  if (pastData) {
    const pastMatches = (pastData.matches || []).filter(m =>
      teamIds.has(m.homeTeam.id) || teamIds.has(m.awayTeam.id)
    )

    for (const match of pastMatches) {
      await prisma.sportMatch.upsert({
        where: { externalId: match.id },
        update: {
          status: match.status,
          homeScoreFullTime: match.score?.fullTime?.home,
          awayScoreFullTime: match.score?.fullTime?.away,
          homeScoreHalfTime: match.score?.halfTime?.home,
          awayScoreHalfTime: match.score?.halfTime?.away,
          lastUpdatedAt: new Date(),
        },
        create: {
          externalId: match.id,
          competitionCode: match.competition?.code || '',
          competitionName: match.competition?.name || '',
          competitionEmblem: match.competition?.emblem,
          matchday: match.matchday,
          stage: match.stage,
          homeTeamId: match.homeTeam.id,
          homeTeamName: match.homeTeam.name,
          homeTeamCrest: match.homeTeam.crest,
          awayTeamId: match.awayTeam.id,
          awayTeamName: match.awayTeam.name,
          awayTeamCrest: match.awayTeam.crest,
          status: match.status,
          utcDate: new Date(match.utcDate),
          homeScoreFullTime: match.score?.fullTime?.home,
          awayScoreFullTime: match.score?.fullTime?.away,
          homeScoreHalfTime: match.score?.halfTime?.home,
          awayScoreHalfTime: match.score?.halfTime?.away,
        },
      })
    }

    console.log(`📅 Synced ${pastMatches.length} past results (last 7 days)`)
  }
}

// ===== WHATSAPP SESSION SYNC =====

async function syncWhatsAppSessions() {
  // Sync all WhatsApp sessions from the bridge to the DB
  const sessions = await prisma.whatsAppSession.findMany()

  for (const wa of sessions) {
    try {
      const res = await fetch(`${WAHA_URL}/api/sessions/${wa.sessionName}`)
      if (!res.ok) continue
      const data = await res.json()

      const bridgeStatus = data.status === 'WORKING' ? 'CONNECTED'
        : data.status === 'SCAN_QR_CODE' ? 'QR_READY'
        : data.status === 'NOT_FOUND' ? 'DISCONNECTED'
        : wa.status

      const phoneNumber = data.phoneNumber || wa.phoneNumber

      if (bridgeStatus !== wa.status || (phoneNumber && phoneNumber !== wa.phoneNumber)) {
        await prisma.whatsAppSession.update({
          where: { id: wa.id },
          data: {
            status: bridgeStatus,
            ...(phoneNumber ? { phoneNumber } : {}),
            ...(bridgeStatus === 'CONNECTED' ? { lastSeenAt: new Date() } : {}),
          },
        })
        console.log(`📱 [${wa.sessionName}] DB synced: ${wa.status} → ${bridgeStatus}${phoneNumber ? ` (phone: +${phoneNumber})` : ''}`)
      }
    } catch {
      // Bridge unreachable — keep existing DB state
    }
  }
}

// ===== POISSON v3 PRO: MULTI-FACTOR PREDICTION MODEL =====
//
// Improvements over v2:
// 1. Dixon-Coles correction (adjusts low-scoring outcomes)
// 2. ELO rating system (dynamic team strength)
// 3. Market-implied probability blending (60% model + 40% market)
// 4. Rest days / fixture congestion
// 5. Head-to-head historical adjustment
// 6. Regression to mean (shrinkage for extreme values)
// 7. Confidence-weighted form with goal supremacy

const FORM_WEIGHT = 0.3
const MAX_GOALS = 8
const DIXON_COLES_RHO = -0.13  // Typical ρ from literature (negative = more draws)
const ELO_K_BASE = 20          // Base K-factor for ELO updates
const ELO_HOME_ADVANTAGE = 65  // ELO points for home advantage
const MARKET_BLEND_ALPHA = 0.6 // 60% model, 40% market
const SHRINKAGE_K = 8          // Regression to mean parameter
const H2H_WEIGHT = 0.08        // Max 8% adjustment from head-to-head

// --- Poisson PMF ---
function poissonPmf(lambda, k) {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let factorial = 1
  for (let i = 2; i <= k; i++) factorial *= i
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial
}

// --- Dixon-Coles Correction ---
// Adjusts P(0,0), P(1,0), P(0,1), P(1,1) for correlation in low scores
function dixonColesCorrection(homeGoals, awayGoals, homeXG, awayXG, rho) {
  if (homeGoals === 0 && awayGoals === 0) {
    return 1 - homeXG * awayXG * rho
  } else if (homeGoals === 1 && awayGoals === 0) {
    return 1 + awayXG * rho
  } else if (homeGoals === 0 && awayGoals === 1) {
    return 1 + homeXG * rho
  } else if (homeGoals === 1 && awayGoals === 1) {
    return 1 - rho
  }
  return 1.0 // No correction for other scores
}

// --- ELO Rating System ---
function eloExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

function eloUpdate(rating, expected, actual, goalDiff) {
  // K-factor scales with goal difference (FiveThirtyEight approach)
  const k = ELO_K_BASE * (goalDiff > 1 ? Math.log(goalDiff + 1) : 1)
  return rating + k * (actual - expected)
}

// Convert ELO difference to win probability adjustment
function eloToProb(homeElo, awayElo) {
  const diff = homeElo + ELO_HOME_ADVANTAGE - awayElo
  // Returns a multiplier: >1 favors home, <1 favors away
  return 1 / (1 + Math.pow(10, -diff / 400))
}

// --- Regression to Mean ---
// Shrinks extreme attack/defense values toward 1.0 based on sample size
function regressToMean(value, matchesPlayed, k = SHRINKAGE_K) {
  const weight = matchesPlayed / (matchesPlayed + k)
  return value * weight + 1.0 * (1 - weight)
}

// --- Rest Days Factor ---
function restDaysFactor(days) {
  if (days === null || days === undefined) return 1.0
  if (days <= 2) return 0.93   // Very fatigued (e.g., CL Wed → League Sat)
  if (days <= 3) return 0.96   // Slightly fatigued
  if (days <= 7) return 1.0    // Normal rest
  if (days <= 14) return 0.98  // Slight rustiness from long break
  return 0.96                  // Extended break (winter, injury layoff)
}

// --- Core Prediction with Dixon-Coles ---
function predictMatch(homeAttack, homeDefense, awayAttack, awayDefense, leagueHomeAvg = 1.55, leagueAwayAvg = 1.25) {
  const homeXG = Math.max(0.2, Math.min(5.0, homeAttack * awayDefense * leagueHomeAvg))
  const awayXG = Math.max(0.2, Math.min(5.0, awayAttack * homeDefense * leagueAwayAvg))

  let homeWin = 0, draw = 0, awayWin = 0, over25 = 0
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const baseProb = poissonPmf(homeXG, h) * poissonPmf(awayXG, a)
      // Apply Dixon-Coles correction for low-scoring outcomes
      const dcFactor = dixonColesCorrection(h, a, homeXG, awayXG, DIXON_COLES_RHO)
      const prob = baseProb * dcFactor

      if (h > a) homeWin += prob
      else if (h === a) draw += prob
      else awayWin += prob
      if (h + a > 2) over25 += prob
    }
  }

  // Normalize after Dixon-Coles (correction can shift total slightly)
  const total = homeWin + draw + awayWin
  if (total > 0) {
    homeWin /= total
    draw /= total
    awayWin /= total
  }

  return { homeWin, draw, awayWin, over25, under25: 1 - over25, homeXG, awayXG }
}

// --- Market-Implied Probabilities ---
function getMarketImpliedProbs(matchOdds) {
  if (!matchOdds || matchOdds.length === 0) return null

  // Average odds across all bookmakers (consensus)
  let sumHome = 0, sumDraw = 0, sumAway = 0, count = 0
  for (const odds of matchOdds) {
    sumHome += 1 / odds.homeOdds
    sumDraw += 1 / odds.drawOdds
    sumAway += 1 / odds.awayOdds
    count++
  }

  if (count === 0) return null

  // Average implied probs (with overround)
  const impliedHome = sumHome / count
  const impliedDraw = sumDraw / count
  const impliedAway = sumAway / count

  // Remove overround (normalize to sum = 1)
  const overround = impliedHome + impliedDraw + impliedAway
  return {
    home: impliedHome / overround,
    draw: impliedDraw / overround,
    away: impliedAway / overround,
    overround, // Track for confidence (lower = more efficient market)
  }
}

// --- Blend Model + Market ---
function blendProbabilities(model, market, alpha = MARKET_BLEND_ALPHA) {
  if (!market) return { home: model.homeWin, draw: model.draw, away: model.awayWin }
  return {
    home: model.homeWin * alpha + market.home * (1 - alpha),
    draw: model.draw * alpha + market.draw * (1 - alpha),
    away: model.awayWin * alpha + market.away * (1 - alpha),
  }
}

// --- EV & Kelly ---
function calculateEV(trueProb, decimalOdds) {
  return (trueProb * decimalOdds) - 1
}

function kellyStake(trueProb, decimalOdds, fraction = 0.25) {
  const b = decimalOdds - 1
  if (b <= 0) return 0
  const kelly = ((trueProb * (b + 1)) - 1) / b
  return Math.max(0, kelly * fraction)
}

// Competition code -> Odds API sport key
const COMP_TO_ODDS = {
  'BL1': 'soccer_germany_bundesliga',
  'PL': 'soccer_epl',
  'PD': 'soccer_spain_la_liga',
  'SA': 'soccer_italy_serie_a',
  'FL1': 'soccer_france_ligue_one',
  'ELC': 'soccer_england_league1',
  'DED': 'soccer_netherlands_eredivisie',
  'PPL': 'soccer_portugal_primeira_liga',
  'CL': 'soccer_uefa_champs_league',
  'WC': 'soccer_fifa_world_cup',
  'EC': 'soccer_uefa_european_championship',
}

// International competitions (handled differently: no season-long stats)
const INTERNATIONAL_COMPS = ['WC', 'EC']

// Team name aliases for matching between APIs
const TEAM_ALIASES = {
  'FC Bayern München': ['Bayern Munich', 'FC Bayern Munich'],
  'Borussia Dortmund': ['Borussia Dortmund', 'Dortmund'],
  'Bayer 04 Leverkusen': ['Bayer Leverkusen', 'Bayer 04 Leverkusen'],
  'RB Leipzig': ['RB Leipzig', 'Leipzig'],
  'VfB Stuttgart': ['VfB Stuttgart', 'Stuttgart'],
  'Eintracht Frankfurt': ['Eintracht Frankfurt', 'Frankfurt'],
  'VfL Wolfsburg': ['VfL Wolfsburg', 'Wolfsburg'],
  'SC Freiburg': ['SC Freiburg', 'Freiburg'],
  'Borussia Mönchengladbach': ['Borussia Monchengladbach', 'Gladbach'],
  '1. FC Union Berlin': ['Union Berlin'],
  'SV Werder Bremen': ['Werder Bremen'],
  '1. FSV Mainz 05': ['FSV Mainz 05', 'Mainz 05'],
  'Manchester City FC': ['Manchester City'],
  'Arsenal FC': ['Arsenal'],
  'Liverpool FC': ['Liverpool'],
  'Manchester United FC': ['Manchester United'],
  'Chelsea FC': ['Chelsea'],
  'Tottenham Hotspur FC': ['Tottenham Hotspur', 'Tottenham'],
  'FC Barcelona': ['Barcelona'],
  'Real Madrid CF': ['Real Madrid'],
  'Club Atlético de Madrid': ['Atletico Madrid'],
  'FC Internazionale Milano': ['Inter Milan', 'Inter'],
  'AC Milan': ['AC Milan'],
  'Juventus FC': ['Juventus'],
  'SSC Napoli': ['Napoli'],
  // National Teams
  'Germany': ['Germany', 'Deutschland'],
  'France': ['France', 'Frankreich'],
  'Spain': ['Spain', 'Spanien'],
  'Italy': ['Italy', 'Italien'],
  'England': ['England'],
  'Portugal': ['Portugal'],
  'Netherlands': ['Netherlands', 'Holland', 'Niederlande'],
  'Belgium': ['Belgium', 'Belgien'],
  'Brazil': ['Brazil', 'Brasilien'],
  'Argentina': ['Argentina', 'Argentinien'],
  'Croatia': ['Croatia', 'Kroatien'],
  'Denmark': ['Denmark', 'Dänemark'],
  'Switzerland': ['Switzerland', 'Schweiz'],
  'Austria': ['Austria', 'Österreich'],
  'Poland': ['Poland', 'Polen'],
  'Turkey': ['Turkey', 'Türkei'],
  'Ukraine': ['Ukraine'],
  'Serbia': ['Serbia', 'Serbien'],
  'Scotland': ['Scotland', 'Schottland'],
  'Sweden': ['Sweden', 'Schweden'],
  'Norway': ['Norway', 'Norwegen'],
  'USA': ['United States', 'USA', 'US'],
  'Mexico': ['Mexico', 'Mexiko'],
  'Japan': ['Japan'],
  'South Korea': ['South Korea', 'Korea Republic'],
  'Australia': ['Australia', 'Australien'],
  'Canada': ['Canada', 'Kanada'],
  'Morocco': ['Morocco', 'Marokko'],
  'Senegal': ['Senegal'],
  'Colombia': ['Colombia', 'Kolumbien'],
  'Uruguay': ['Uruguay'],
  'Ecuador': ['Ecuador'],
  'Wales': ['Wales'],
  'Czech Republic': ['Czech Republic', 'Czechia', 'Tschechien'],
  'Hungary': ['Hungary', 'Ungarn'],
  'Romania': ['Romania', 'Rumänien'],
  'Greece': ['Greece', 'Griechenland'],
  'Republic of Ireland': ['Republic of Ireland', 'Ireland'],
  'Chile': ['Chile'],
  'Peru': ['Peru'],
  'Paraguay': ['Paraguay'],
  'Venezuela': ['Venezuela'],
  'Costa Rica': ['Costa Rica'],
  'Panama': ['Panama'],
  'Honduras': ['Honduras'],
  'Jamaica': ['Jamaica', 'Jamaika'],
  'Qatar': ['Qatar', 'Katar'],
  'Saudi Arabia': ['Saudi Arabia', 'Saudi-Arabien'],
  'Iran': ['Iran'],
  'Ghana': ['Ghana'],
  'Cameroon': ['Cameroon', 'Kamerun'],
  'Nigeria': ['Nigeria'],
  'Tunisia': ['Tunisia', 'Tunesien'],
  'Egypt': ['Egypt', 'Ägypten'],
  'Algeria': ['Algeria', 'Algerien'],
  'Ivory Coast': ['Ivory Coast', 'Cote D\'Ivoire', 'Elfenbeinküste'],
}

function matchTeamName(fdName, oddsNames) {
  if (oddsNames.includes(fdName)) return fdName
  const aliases = TEAM_ALIASES[fdName]
  if (aliases) {
    for (const alias of aliases) {
      const found = oddsNames.find(n => n.toLowerCase() === alias.toLowerCase())
      if (found) return found
    }
  }
  // Fuzzy: substring match
  const fdLower = fdName.toLowerCase()
  for (const name of oddsNames) {
    if (fdLower.includes(name.toLowerCase()) || name.toLowerCase().includes(fdLower)) return name
  }
  return null
}

// ===== ODDS API =====

async function fetchOddsForCompetition(competitionCode) {
  if (!ODDS_API_KEY) return []
  const sportKey = COMP_TO_ODDS[competitionCode]
  if (!sportKey) return []

  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`📊 Odds API error (${res.status}):`, await res.text())
      return []
    }
    const remaining = res.headers.get('x-requests-remaining')
    console.log(`📊 Odds API: ${remaining} credits remaining`)
    return await res.json()
  } catch (err) {
    console.error('📊 Odds API fetch error:', err.message)
    return []
  }
}

// ===== TEAM STATS & PREDICTIONS =====

// All competitions to fetch stats for (club leagues + international)
const SUPPORTED_LEAGUES = ['BL1', 'PL', 'PD', 'SA', 'FL1', 'ELC', 'DED', 'PPL']
const ALL_COMPETITIONS = [...SUPPORTED_LEAGUES, 'WC', 'EC', 'CL']

async function updateTeamStats() {
  console.log('📊 Updating team stats from full season data...')
  const currentYear = new Date().getFullYear()
  // Season year: if before August, use previous year as season start
  const month = new Date().getMonth()
  const season = month < 7 ? currentYear - 1 : currentYear

  for (const compCode of SUPPORTED_LEAGUES) {
    try {
      // 1. Fetch full season matches for ALL teams in this league (not just followed)
      const matchData = await footballApi(`/competitions/${compCode}/matches?season=${season}&status=FINISHED`)
      if (!matchData || !matchData.matches || matchData.matches.length === 0) {
        console.log(`📊 [${compCode}] No season data available`)
        continue
      }

      const allMatches = matchData.matches
      console.log(`📊 [${compCode}] Processing ${allMatches.length} season matches`)

      // 2. Calculate league-wide averages
      let totalHomeGoals = 0, totalAwayGoals = 0, totalGames = 0
      for (const m of allMatches) {
        const hg = m.score?.fullTime?.home
        const ag = m.score?.fullTime?.away
        if (hg === null || hg === undefined || ag === null || ag === undefined) continue
        totalHomeGoals += hg
        totalAwayGoals += ag
        totalGames++
      }
      if (totalGames === 0) continue

      const leagueAvgHomeGoals = totalHomeGoals / totalGames
      const leagueAvgAwayGoals = totalAwayGoals / totalGames
      console.log(`📊 [${compCode}] League avg: ${leagueAvgHomeGoals.toFixed(2)} home, ${leagueAvgAwayGoals.toFixed(2)} away (${totalGames} games)`)

      // 3. Build per-team statistics with full home/away split + ELO
      const teamData = {}

      // Sort matches chronologically for ELO calculation
      const sortedMatches = [...allMatches]
        .filter(m => m.score?.fullTime?.home !== null && m.score?.fullTime?.home !== undefined)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

      // Initialize all teams
      for (const m of sortedMatches) {
        for (const [id, name] of [[m.homeTeam.id, m.homeTeam.name], [m.awayTeam.id, m.awayTeam.name]]) {
          if (!teamData[id]) {
            teamData[id] = {
              teamName: name,
              goalsScored: 0, goalsConceded: 0, matchesPlayed: 0,
              homeGoalsScored: 0, homeGoalsConceded: 0, homeMatches: 0,
              awayGoalsScored: 0, awayGoalsConceded: 0, awayMatches: 0,
              recentMatches: [],
              elo: 1500, // Starting ELO
              lastMatchDate: null,
            }
          }
        }
      }

      // Process matches chronologically (important for ELO)
      for (const m of sortedMatches) {
        const hg = m.score.fullTime.home
        const ag = m.score.fullTime.away

        const homeId = m.homeTeam.id
        const awayId = m.awayTeam.id
        const ht = teamData[homeId]
        const at = teamData[awayId]

        // === ELO UPDATE (before accumulating stats) ===
        const homeExpected = eloExpectedScore(ht.elo + ELO_HOME_ADVANTAGE, at.elo)
        const awayExpected = 1 - homeExpected
        const goalDiff = Math.abs(hg - ag)
        const homeActual = hg > ag ? 1 : hg === ag ? 0.5 : 0
        const awayActual = 1 - homeActual

        ht.elo = eloUpdate(ht.elo, homeExpected, homeActual, goalDiff)
        at.elo = eloUpdate(at.elo, awayExpected, awayActual, goalDiff)

        // === Accumulate stats ===
        ht.goalsScored += hg; ht.goalsConceded += ag; ht.matchesPlayed++
        ht.homeGoalsScored += hg; ht.homeGoalsConceded += ag; ht.homeMatches++
        ht.recentMatches.push({ scored: hg, conceded: ag, date: m.utcDate, isHome: true, goalDiff: hg - ag })
        ht.lastMatchDate = m.utcDate

        at.goalsScored += ag; at.goalsConceded += hg; at.matchesPlayed++
        at.awayGoalsScored += ag; at.awayGoalsConceded += hg; at.awayMatches++
        at.recentMatches.push({ scored: ag, conceded: hg, date: m.utcDate, isHome: false, goalDiff: ag - hg })
        at.lastMatchDate = m.utcDate
      }

      // 4. Calculate attack/defense strengths with home/away split + regression to mean
      for (const [teamIdStr, data] of Object.entries(teamData)) {
        const teamId = parseInt(teamIdStr)

        const leagueOverallAvg = (leagueAvgHomeGoals + leagueAvgAwayGoals) / 2
        const teamAvgScored = data.goalsScored / data.matchesPlayed
        const teamAvgConceded = data.goalsConceded / data.matchesPlayed

        // Raw strengths
        let attackRaw = leagueOverallAvg > 0 ? teamAvgScored / leagueOverallAvg : 1.0
        let defenseRaw = leagueOverallAvg > 0 ? teamAvgConceded / leagueOverallAvg : 1.0

        // Apply regression to mean (shrinkage) — prevents overconfidence with small samples
        const attackStrength = regressToMean(attackRaw, data.matchesPlayed)
        const defenseStrength = regressToMean(defenseRaw, data.matchesPlayed)

        // HOME-SPECIFIC strengths with regression
        let homeAttackStrength = attackStrength, homeDefenseStrength = defenseStrength
        if (data.homeMatches >= 3 && leagueAvgHomeGoals > 0 && leagueAvgAwayGoals > 0) {
          const rawHA = (data.homeGoalsScored / data.homeMatches) / leagueAvgHomeGoals
          const rawHD = (data.homeGoalsConceded / data.homeMatches) / leagueAvgAwayGoals
          homeAttackStrength = regressToMean(rawHA, data.homeMatches)
          homeDefenseStrength = regressToMean(rawHD, data.homeMatches)
        }

        // AWAY-SPECIFIC strengths with regression
        let awayAttackStrength = attackStrength, awayDefenseStrength = defenseStrength
        if (data.awayMatches >= 3 && leagueAvgHomeGoals > 0 && leagueAvgAwayGoals > 0) {
          const rawAA = (data.awayGoalsScored / data.awayMatches) / leagueAvgAwayGoals
          const rawAD = (data.awayGoalsConceded / data.awayMatches) / leagueAvgHomeGoals
          awayAttackStrength = regressToMean(rawAA, data.awayMatches)
          awayDefenseStrength = regressToMean(rawAD, data.awayMatches)
        }

        // Form: last 5 matches, exponentially weighted with goal supremacy
        const recent = data.recentMatches
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-5)

        let formAttack = attackStrength
        let formDefense = defenseStrength
        if (recent.length >= 3) {
          let wScored = 0, wConceded = 0, wSum = 0
          recent.forEach((m, i) => {
            // Exponential weight: most recent match gets highest weight
            const w = Math.pow(1.5, i)
            // Goal supremacy bonus: big wins count more
            const supremacyBonus = 1 + Math.max(0, m.goalDiff) * 0.1
            wScored += m.scored * w * supremacyBonus
            wConceded += m.conceded * w
            wSum += w * supremacyBonus
          })
          formAttack = leagueOverallAvg > 0 ? (wScored / wSum) / leagueOverallAvg : 1.0
          formDefense = leagueOverallAvg > 0 ? (wConceded / (wSum / (1 + 0))) / leagueOverallAvg : 1.0
        }

        const statsData = {
          teamName: data.teamName,
          attackStrength: parseFloat(attackStrength.toFixed(4)),
          defenseStrength: parseFloat(defenseStrength.toFixed(4)),
          homeAttackStrength: parseFloat(homeAttackStrength.toFixed(4)),
          homeDefenseStrength: parseFloat(homeDefenseStrength.toFixed(4)),
          awayAttackStrength: parseFloat(awayAttackStrength.toFixed(4)),
          awayDefenseStrength: parseFloat(awayDefenseStrength.toFixed(4)),
          leagueAvgHomeGoals: parseFloat(leagueAvgHomeGoals.toFixed(4)),
          leagueAvgAwayGoals: parseFloat(leagueAvgAwayGoals.toFixed(4)),
          matchesPlayed: data.matchesPlayed,
          goalsScored: data.goalsScored,
          goalsConceded: data.goalsConceded,
          homeGoalsScored: data.homeGoalsScored,
          homeGoalsConceded: data.homeGoalsConceded,
          awayGoalsScored: data.awayGoalsScored,
          awayGoalsConceded: data.awayGoalsConceded,
          homeMatchesPlayed: data.homeMatches,
          awayMatchesPlayed: data.awayMatches,
          formAttack: parseFloat(formAttack.toFixed(4)),
          formDefense: parseFloat(formDefense.toFixed(4)),
          eloRating: parseFloat(data.elo.toFixed(1)),
          lastMatchDate: data.lastMatchDate ? new Date(data.lastMatchDate) : null,
        }

        await prisma.teamStats.upsert({
          where: {
            teamId_competitionCode_season: { teamId, competitionCode: compCode, season },
          },
          update: statsData,
          create: { teamId, competitionCode: compCode, season, ...statsData },
        })
      }

      console.log(`📊 [${compCode}] Updated stats + ELO for ${Object.keys(teamData).length} teams (${totalGames} matches)`)

      // Rate limit: wait between league fetches (free tier = 10 req/min)
      await sleep(7000)
    } catch (err) {
      console.error(`📊 [${compCode}] Error:`, err.message)
    }
  }

  // === INTERNATIONAL COMPETITIONS (WC, EC) ===
  // National teams: use last tournament data + recent matches
  for (const compCode of INTERNATIONAL_COMPS) {
    try {
      const matchData = await footballApi(`/competitions/${compCode}/matches?status=FINISHED`)
      if (!matchData || !matchData.matches || matchData.matches.length === 0) {
        console.log(`📊 [${compCode}] No finished matches`)
        await sleep(7000)
        continue
      }

      const allMatches = matchData.matches
      console.log(`📊 [${compCode}] Processing ${allMatches.length} international matches`)

      // Calculate averages across all international matches
      let totalHomeGoals = 0, totalAwayGoals = 0, totalGames = 0
      for (const m of allMatches) {
        const hg = m.score?.fullTime?.home
        const ag = m.score?.fullTime?.away
        if (hg === null || hg === undefined || ag === null || ag === undefined) continue
        totalHomeGoals += hg
        totalAwayGoals += ag
        totalGames++
      }
      if (totalGames === 0) { await sleep(7000); continue }

      const leagueAvgHomeGoals = totalHomeGoals / totalGames
      const leagueAvgAwayGoals = totalAwayGoals / totalGames

      // Build team stats (same approach but with 'season' = tournament year)
      const teamData = {}
      const sortedMatches = [...allMatches]
        .filter(m => m.score?.fullTime?.home !== null && m.score?.fullTime?.home !== undefined)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

      for (const m of sortedMatches) {
        for (const [id, name] of [[m.homeTeam.id, m.homeTeam.name], [m.awayTeam.id, m.awayTeam.name]]) {
          if (!teamData[id]) {
            teamData[id] = {
              teamName: name, goalsScored: 0, goalsConceded: 0, matchesPlayed: 0,
              homeGoalsScored: 0, homeGoalsConceded: 0, homeMatches: 0,
              awayGoalsScored: 0, awayGoalsConceded: 0, awayMatches: 0,
              recentMatches: [], elo: 1500, lastMatchDate: null,
            }
          }
        }
      }

      for (const m of sortedMatches) {
        const hg = m.score.fullTime.home
        const ag = m.score.fullTime.away
        const homeId = m.homeTeam.id
        const awayId = m.awayTeam.id
        const ht = teamData[homeId]
        const at = teamData[awayId]

        // ELO update
        const homeExpected = eloExpectedScore(ht.elo + ELO_HOME_ADVANTAGE, at.elo)
        const goalDiff = Math.abs(hg - ag)
        const homeActual = hg > ag ? 1 : hg === ag ? 0.5 : 0
        ht.elo = eloUpdate(ht.elo, homeExpected, homeActual, goalDiff)
        at.elo = eloUpdate(at.elo, 1 - homeExpected, 1 - homeActual, goalDiff)

        // Stats
        ht.goalsScored += hg; ht.goalsConceded += ag; ht.matchesPlayed++
        ht.homeGoalsScored += hg; ht.homeGoalsConceded += ag; ht.homeMatches++
        ht.recentMatches.push({ scored: hg, conceded: ag, date: m.utcDate, isHome: true, goalDiff: hg - ag })
        ht.lastMatchDate = m.utcDate

        at.goalsScored += ag; at.goalsConceded += hg; at.matchesPlayed++
        at.awayGoalsScored += ag; at.awayGoalsConceded += hg; at.awayMatches++
        at.recentMatches.push({ scored: ag, conceded: hg, date: m.utcDate, isHome: false, goalDiff: ag - hg })
        at.lastMatchDate = m.utcDate
      }

      // Save stats (use currentYear as season for internationals)
      const intSeason = currentYear
      const leagueOverallAvg = (leagueAvgHomeGoals + leagueAvgAwayGoals) / 2

      for (const [teamIdStr, data] of Object.entries(teamData)) {
        const teamId = parseInt(teamIdStr)
        const attackRaw = leagueOverallAvg > 0 ? (data.goalsScored / data.matchesPlayed) / leagueOverallAvg : 1.0
        const defenseRaw = leagueOverallAvg > 0 ? (data.goalsConceded / data.matchesPlayed) / leagueOverallAvg : 1.0
        const attackStrength = regressToMean(attackRaw, data.matchesPlayed)
        const defenseStrength = regressToMean(defenseRaw, data.matchesPlayed)

        let homeAttackStrength = attackStrength, homeDefenseStrength = defenseStrength
        let awayAttackStrength = attackStrength, awayDefenseStrength = defenseStrength
        if (data.homeMatches >= 2 && leagueAvgHomeGoals > 0) {
          homeAttackStrength = regressToMean((data.homeGoalsScored / data.homeMatches) / leagueAvgHomeGoals, data.homeMatches)
          homeDefenseStrength = regressToMean((data.homeGoalsConceded / data.homeMatches) / leagueAvgAwayGoals, data.homeMatches)
        }
        if (data.awayMatches >= 2 && leagueAvgAwayGoals > 0) {
          awayAttackStrength = regressToMean((data.awayGoalsScored / data.awayMatches) / leagueAvgAwayGoals, data.awayMatches)
          awayDefenseStrength = regressToMean((data.awayGoalsConceded / data.awayMatches) / leagueAvgHomeGoals, data.awayMatches)
        }

        // Form from last 5
        const recent = data.recentMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-5)
        let formAttack = attackStrength, formDefense = defenseStrength
        if (recent.length >= 2) {
          let wScored = 0, wConceded = 0, wSum = 0
          recent.forEach((m, i) => {
            const w = Math.pow(1.5, i)
            const bonus = 1 + Math.max(0, m.goalDiff) * 0.1
            wScored += m.scored * w * bonus
            wConceded += m.conceded * w
            wSum += w * bonus
          })
          formAttack = leagueOverallAvg > 0 ? (wScored / wSum) / leagueOverallAvg : 1.0
          formDefense = leagueOverallAvg > 0 ? (wConceded / (wSum / 1)) / leagueOverallAvg : 1.0
        }

        await prisma.teamStats.upsert({
          where: { teamId_competitionCode_season: { teamId, competitionCode: compCode, season: intSeason } },
          update: {
            teamName: data.teamName, attackStrength: parseFloat(attackStrength.toFixed(4)),
            defenseStrength: parseFloat(defenseStrength.toFixed(4)),
            homeAttackStrength: parseFloat(homeAttackStrength.toFixed(4)),
            homeDefenseStrength: parseFloat(homeDefenseStrength.toFixed(4)),
            awayAttackStrength: parseFloat(awayAttackStrength.toFixed(4)),
            awayDefenseStrength: parseFloat(awayDefenseStrength.toFixed(4)),
            leagueAvgHomeGoals: parseFloat(leagueAvgHomeGoals.toFixed(4)),
            leagueAvgAwayGoals: parseFloat(leagueAvgAwayGoals.toFixed(4)),
            matchesPlayed: data.matchesPlayed, goalsScored: data.goalsScored, goalsConceded: data.goalsConceded,
            homeGoalsScored: data.homeGoalsScored, homeGoalsConceded: data.homeGoalsConceded,
            awayGoalsScored: data.awayGoalsScored, awayGoalsConceded: data.awayGoalsConceded,
            homeMatchesPlayed: data.homeMatches, awayMatchesPlayed: data.awayMatches,
            formAttack: parseFloat(formAttack.toFixed(4)), formDefense: parseFloat(formDefense.toFixed(4)),
            eloRating: parseFloat(data.elo.toFixed(1)),
            lastMatchDate: data.lastMatchDate ? new Date(data.lastMatchDate) : null,
          },
          create: {
            teamId, competitionCode: compCode, season: intSeason, teamName: data.teamName,
            attackStrength: parseFloat(attackStrength.toFixed(4)), defenseStrength: parseFloat(defenseStrength.toFixed(4)),
            homeAttackStrength: parseFloat(homeAttackStrength.toFixed(4)), homeDefenseStrength: parseFloat(homeDefenseStrength.toFixed(4)),
            awayAttackStrength: parseFloat(awayAttackStrength.toFixed(4)), awayDefenseStrength: parseFloat(awayDefenseStrength.toFixed(4)),
            leagueAvgHomeGoals: parseFloat(leagueAvgHomeGoals.toFixed(4)), leagueAvgAwayGoals: parseFloat(leagueAvgAwayGoals.toFixed(4)),
            matchesPlayed: data.matchesPlayed, goalsScored: data.goalsScored, goalsConceded: data.goalsConceded,
            homeGoalsScored: data.homeGoalsScored, homeGoalsConceded: data.homeGoalsConceded,
            awayGoalsScored: data.awayGoalsScored, awayGoalsConceded: data.awayGoalsConceded,
            homeMatchesPlayed: data.homeMatches, awayMatchesPlayed: data.awayMatches,
            formAttack: parseFloat(formAttack.toFixed(4)), formDefense: parseFloat(formDefense.toFixed(4)),
            eloRating: parseFloat(data.elo.toFixed(1)),
            lastMatchDate: data.lastMatchDate ? new Date(data.lastMatchDate) : null,
          },
        })
      }

      console.log(`🌍 [${compCode}] Updated stats + ELO for ${Object.keys(teamData).length} national teams (${totalGames} matches)`)
      await sleep(7000)
    } catch (err) {
      console.error(`🌍 [${compCode}] Error:`, err.message)
    }
  }
}

async function syncOddsAndPredict() {
  if (!ODDS_API_KEY) {
    console.log('📊 No ODDS_API_KEY set, skipping odds sync')
    return
  }
  console.log('📊 Syncing odds & generating predictions...')

  // Get upcoming matches for followed teams
  const allFollowed = await prisma.followedTeam.findMany({
    select: { teamId: true },
    distinct: ['teamId'],
  })
  const teamIds = new Set(allFollowed.map(t => t.teamId))

  const upcomingMatches = await prisma.sportMatch.findMany({
    where: {
      status: { in: ['SCHEDULED', 'TIMED'] },
      utcDate: { gte: new Date(), lte: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      OR: [
        { homeTeamId: { in: [...teamIds] } },
        { awayTeamId: { in: [...teamIds] } },
      ],
    },
    orderBy: { utcDate: 'asc' },
  })

  if (upcomingMatches.length === 0) return

  // Group matches by competition
  const matchesByComp = {}
  for (const m of upcomingMatches) {
    if (!matchesByComp[m.competitionCode]) matchesByComp[m.competitionCode] = []
    matchesByComp[m.competitionCode].push(m)
  }

  const currentYear = new Date().getFullYear()

  for (const [compCode, matches] of Object.entries(matchesByComp)) {
    // Fetch odds from The Odds API
    const oddsEvents = await fetchOddsForCompetition(compCode)
    if (oddsEvents.length === 0) continue

    // Build list of all team names from odds
    const allOddsTeams = new Set()
    for (const ev of oddsEvents) {
      allOddsTeams.add(ev.home_team)
      allOddsTeams.add(ev.away_team)
    }

    for (const match of matches) {
      // Match teams to odds event
      const oddsHome = matchTeamName(match.homeTeamName, [...allOddsTeams])
      const oddsAway = matchTeamName(match.awayTeamName, [...allOddsTeams])

      const oddsEvent = oddsEvents.find(ev =>
        (ev.home_team === oddsHome && ev.away_team === oddsAway) ||
        (ev.home_team === oddsAway && ev.away_team === oddsHome)
      )

      if (!oddsEvent) continue

      // Save odds from each bookmaker
      for (const bm of oddsEvent.bookmakers || []) {
        const h2h = bm.markets?.find(m => m.key === 'h2h')
        const totals = bm.markets?.find(m => m.key === 'totals')
        if (!h2h) continue

        const homeOutcome = h2h.outcomes?.find(o => o.name === oddsEvent.home_team)
        const drawOutcome = h2h.outcomes?.find(o => o.name === 'Draw')
        const awayOutcome = h2h.outcomes?.find(o => o.name === oddsEvent.away_team)
        if (!homeOutcome || !drawOutcome || !awayOutcome) continue

        // Check if home/away are flipped vs our match
        const isFlipped = oddsEvent.home_team === oddsAway
        const homeOdds = isFlipped ? awayOutcome.price : homeOutcome.price
        const awayOdds = isFlipped ? homeOutcome.price : awayOutcome.price

        let overOdds = null, underOdds = null
        if (totals) {
          const over = totals.outcomes?.find(o => o.name === 'Over' && o.point === 2.5)
          const under = totals.outcomes?.find(o => o.name === 'Under' && o.point === 2.5)
          if (over) overOdds = over.price
          if (under) underOdds = under.price
        }

        await prisma.matchOdds.upsert({
          where: {
            matchExternalId_bookmaker: { matchExternalId: match.externalId, bookmaker: bm.title },
          },
          update: {
            homeOdds,
            drawOdds: drawOutcome.price,
            awayOdds,
            overUnder25Home: overOdds,
            overUnder25Away: underOdds,
            fetchedAt: new Date(),
          },
          create: {
            matchExternalId: match.externalId,
            bookmaker: bm.title,
            homeOdds,
            drawOdds: drawOutcome.price,
            awayOdds,
            overUnder25Home: overOdds,
            overUnder25Away: underOdds,
          },
        })
      }

      // === GENERATE MULTI-FACTOR PREDICTION ===

      const homeStats = await prisma.teamStats.findFirst({
        where: { teamId: match.homeTeamId, competitionCode: compCode },
        orderBy: { matchesPlayed: 'desc' },
      })
      const awayStats = await prisma.teamStats.findFirst({
        where: { teamId: match.awayTeamId, competitionCode: compCode },
        orderBy: { matchesPlayed: 'desc' },
      })

      if (!homeStats && !awayStats) continue

      const defaultStats = {
        attackStrength: 1.0, defenseStrength: 1.0,
        homeAttackStrength: 1.0, homeDefenseStrength: 1.0,
        awayAttackStrength: 1.0, awayDefenseStrength: 1.0,
        formAttack: 1.0, formDefense: 1.0,
        matchesPlayed: 0, homeMatchesPlayed: 0, awayMatchesPlayed: 0,
        leagueAvgHomeGoals: 1.5, leagueAvgAwayGoals: 1.2,
        eloRating: 1500, lastMatchDate: null,
      }
      const hs = homeStats || defaultStats
      const as_ = awayStats || defaultStats

      // --- Confidence ---
      const homeConf = Math.min(1, (hs.matchesPlayed || 0) / 15)
      const awayConf = Math.min(1, (as_.matchesPlayed || 0) / 15)
      const confidence = (homeConf + awayConf) / 2

      // --- Form-weighted attack/defense (home-specific) ---
      const effectiveFormWeight = FORM_WEIGHT * confidence
      const homeAtk = (hs.homeAttackStrength || hs.attackStrength) * (1 - effectiveFormWeight) + hs.formAttack * effectiveFormWeight
      const homeDef = (hs.homeDefenseStrength || hs.defenseStrength) * (1 - effectiveFormWeight) + hs.formDefense * effectiveFormWeight
      const awayAtk = (as_.awayAttackStrength || as_.attackStrength) * (1 - effectiveFormWeight) + as_.formAttack * effectiveFormWeight
      const awayDef = (as_.awayDefenseStrength || as_.defenseStrength) * (1 - effectiveFormWeight) + as_.formDefense * effectiveFormWeight

      const leagueHomeAvg = hs.leagueAvgHomeGoals || as_.leagueAvgHomeGoals || 1.5
      const leagueAwayAvg = hs.leagueAvgAwayGoals || as_.leagueAvgAwayGoals || 1.2

      // --- FACTOR 1: Dixon-Coles Poisson prediction ---
      const pred = predictMatch(homeAtk, homeDef, awayAtk, awayDef, leagueHomeAvg, leagueAwayAvg)

      // --- FACTOR 2: ELO adjustment ---
      const homeElo = hs.eloRating || 1500
      const awayElo = as_.eloRating || 1500
      const eloProbHome = eloToProb(homeElo, awayElo)
      // Blend ELO into Poisson (20% ELO, 80% Poisson for the model component)
      const eloWeight = 0.2
      pred.homeWin = pred.homeWin * (1 - eloWeight) + eloProbHome * eloWeight
      pred.awayWin = pred.awayWin * (1 - eloWeight) + (1 - eloProbHome) * 0.7 * eloWeight // 70% of non-home goes to away
      pred.draw = 1 - pred.homeWin - pred.awayWin

      // --- FACTOR 3: Rest days ---
      let restDaysHome = null, restDaysAway = null
      if (hs.lastMatchDate) {
        restDaysHome = Math.round((new Date(match.utcDate).getTime() - new Date(hs.lastMatchDate).getTime()) / (24 * 60 * 60 * 1000))
      }
      if (as_.lastMatchDate) {
        restDaysAway = Math.round((new Date(match.utcDate).getTime() - new Date(as_.lastMatchDate).getTime()) / (24 * 60 * 60 * 1000))
      }
      const restHomeF = restDaysFactor(restDaysHome)
      const restAwayF = restDaysFactor(restDaysAway)
      // Apply rest factor as relative advantage
      if (restHomeF !== restAwayF) {
        const restRatio = restHomeF / restAwayF
        pred.homeWin *= restRatio
        pred.awayWin *= (1 / restRatio)
        // Re-normalize
        const restTotal = pred.homeWin + pred.draw + pred.awayWin
        pred.homeWin /= restTotal; pred.draw /= restTotal; pred.awayWin /= restTotal
      }

      // --- FACTOR 4: Head-to-head adjustment ---
      let h2hAdjustment = 0
      try {
        const h2hMatches = await prisma.sportMatch.findMany({
          where: {
            status: 'FINISHED',
            OR: [
              { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
              { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
            ],
          },
          orderBy: { utcDate: 'desc' },
          take: 6, // Last 6 meetings
        })

        if (h2hMatches.length >= 2) {
          let h2hHomeWins = 0, h2hDraws = 0, h2hAwayWins = 0
          for (const h2h of h2hMatches) {
            if (h2h.homeScoreFullTime === null || h2h.awayScoreFullTime === null) continue
            const isNormalOrder = h2h.homeTeamId === match.homeTeamId
            const homeGoals = isNormalOrder ? h2h.homeScoreFullTime : h2h.awayScoreFullTime
            const awayGoals = isNormalOrder ? h2h.awayScoreFullTime : h2h.homeScoreFullTime
            if (homeGoals > awayGoals) h2hHomeWins++
            else if (homeGoals < awayGoals) h2hAwayWins++
            else h2hDraws++
          }
          const h2hTotal = h2hHomeWins + h2hDraws + h2hAwayWins
          if (h2hTotal >= 2) {
            const h2hHomePct = h2hHomeWins / h2hTotal
            const h2hDrawPct = h2hDraws / h2hTotal
            const h2hAwayPct = h2hAwayWins / h2hTotal
            // Blend H2H at H2H_WEIGHT (8% max)
            const w = H2H_WEIGHT * Math.min(1, h2hTotal / 4) // Scale by sample size
            pred.homeWin = pred.homeWin * (1 - w) + h2hHomePct * w
            pred.draw = pred.draw * (1 - w) + h2hDrawPct * w
            pred.awayWin = pred.awayWin * (1 - w) + h2hAwayPct * w
            h2hAdjustment = w
          }
        }
      } catch (err) {
        // H2H lookup failed, continue without it
      }

      // --- FACTOR 5: Market-implied probability blending ---
      const matchOdds = await prisma.matchOdds.findMany({
        where: { matchExternalId: match.externalId },
      })

      const marketProbs = getMarketImpliedProbs(matchOdds)
      const blended = blendProbabilities(pred, marketProbs, MARKET_BLEND_ALPHA)

      // Use blended probabilities for value bet detection
      // (model says X, market says Y — value exists when they disagree enough)
      // For VALUE BET: compare RAW MODEL prob vs odds (not blended, because blended includes market)
      const minEVThreshold = confidence >= 0.7 ? 0.05 : confidence >= 0.5 ? 0.10 : 999

      let bestMarket = null, bestEV = -1, bestOdds = 0, bestBookmaker = null, bestKelly = 0
      for (const odds of matchOdds) {
        const markets = [
          { market: 'home', prob: pred.homeWin, odds: odds.homeOdds },
          { market: 'draw', prob: pred.draw, odds: odds.drawOdds },
          { market: 'away', prob: pred.awayWin, odds: odds.awayOdds },
        ]
        if (odds.overUnder25Home) markets.push({ market: 'over25', prob: pred.over25, odds: odds.overUnder25Home })
        if (odds.overUnder25Away) markets.push({ market: 'under25', prob: pred.under25, odds: odds.overUnder25Away })

        for (const m of markets) {
          const ev = calculateEV(m.prob, m.odds)
          if (ev > bestEV) {
            bestEV = ev
            bestMarket = m.market
            bestOdds = m.odds
            bestBookmaker = odds.bookmaker
            bestKelly = kellyStake(m.prob, m.odds, 0.25)
          }
        }
      }

      const hasValue = bestEV >= minEVThreshold

      const predData = {
        homeWinProb: blended.home,
        drawProb: blended.draw,
        awayWinProb: blended.away,
        overProb: pred.over25,
        underProb: pred.under25,
        expectedHomeGoals: pred.homeXG,
        expectedAwayGoals: pred.awayXG,
        blendedHomeProb: blended.home,
        blendedDrawProb: blended.draw,
        blendedAwayProb: blended.away,
        eloHomeRating: homeElo,
        eloAwayRating: awayElo,
        restDaysHome,
        restDaysAway,
        h2hAdjustment: h2hAdjustment > 0 ? h2hAdjustment : null,
        bestValueMarket: hasValue ? bestMarket : null,
        bestValueEV: hasValue ? bestEV : null,
        bestValueOdds: hasValue ? bestOdds : null,
        bestValueBookmaker: hasValue ? bestBookmaker : null,
        kellyStake: hasValue ? bestKelly : null,
        confidence,
        modelVersion: 'poisson_v3_pro',
      }

      await prisma.matchPrediction.upsert({
        where: { matchExternalId: match.externalId },
        update: predData,
        create: { matchExternalId: match.externalId, ...predData },
      })
    }
  }

  console.log('📊 Odds & predictions sync complete')
}

// Update Brier scores for finished matches
async function updateBrierScores() {
  const predictions = await prisma.matchPrediction.findMany({
    where: { actualResult: null },
  })

  for (const pred of predictions) {
    const match = await prisma.sportMatch.findUnique({
      where: { externalId: pred.matchExternalId },
    })
    if (!match || match.status !== 'FINISHED') continue
    if (match.homeScoreFullTime === null || match.awayScoreFullTime === null) continue

    const actual = match.homeScoreFullTime > match.awayScoreFullTime ? 'home'
      : match.homeScoreFullTime < match.awayScoreFullTime ? 'away'
      : 'draw'

    const actualVec = { home: actual === 'home' ? 1 : 0, draw: actual === 'draw' ? 1 : 0, away: actual === 'away' ? 1 : 0 }
    const brier = (
      Math.pow(pred.homeWinProb - actualVec.home, 2) +
      Math.pow(pred.drawProb - actualVec.draw, 2) +
      Math.pow(pred.awayWinProb - actualVec.away, 2)
    ) / 3

    await prisma.matchPrediction.update({
      where: { id: pred.id },
      data: {
        actualResult: actual,
        actualHomeGoals: match.homeScoreFullTime,
        actualAwayGoals: match.awayScoreFullTime,
        brierScore: parseFloat(brier.toFixed(6)),
      },
    })
  }
}

// Send value bet notifications via WhatsApp
async function sendValueBetNotifications() {
  if (!ODDS_API_KEY) return

  const users = await prisma.valueBetSettings.findMany({
    where: { enabled: true, notifyWhatsApp: true },
  })

  for (const settings of users) {
    const wa = await prisma.whatsAppSession.findUnique({ where: { userId: settings.userId } })
    if (!wa || wa.status !== 'CONNECTED' || !wa.phoneNumber) continue

    const followed = await prisma.followedTeam.findMany({
      where: { userId: settings.userId },
      select: { teamId: true },
    })
    const teamIds = followed.map(t => t.teamId)

    // Get predictions with value bets for upcoming matches of followed teams
    const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const matches = await prisma.sportMatch.findMany({
      where: {
        status: { in: ['SCHEDULED', 'TIMED'] },
        utcDate: { gte: new Date(), lte: tomorrow },
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
    })

    for (const match of matches) {
      const pred = await prisma.matchPrediction.findUnique({
        where: { matchExternalId: match.externalId },
      })
      if (!pred || !pred.bestValueMarket || (pred.bestValueEV || 0) < settings.minEV) continue

      const eventKey = `match_${match.externalId}_valuebet_${pred.bestValueMarket}`
      const marketNames = { home: 'Heimsieg', draw: 'Unentschieden', away: 'Auswärtssieg', over25: 'Über 2.5', under25: 'Unter 2.5' }
      const stake = (pred.kellyStake || 0) * settings.bankroll

      const msg = `💰 *VALUE BET GEFUNDEN!*\n\n` +
        `${match.homeTeamName} vs ${match.awayTeamName}\n` +
        `🏆 ${match.competitionName}\n` +
        `📅 ${new Date(match.utcDate).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${new Date(match.utcDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })}\n\n` +
        `📊 *Empfehlung: ${marketNames[pred.bestValueMarket] || pred.bestValueMarket}*\n` +
        `📈 Quote: ${pred.bestValueOdds?.toFixed(2)} (${pred.bestValueBookmaker})\n` +
        `🎯 Modell: ${(pred.homeWinProb * 100).toFixed(0)}% / ${(pred.drawProb * 100).toFixed(0)}% / ${(pred.awayWinProb * 100).toFixed(0)}%\n` +
        `✅ EV: +${((pred.bestValueEV || 0) * 100).toFixed(1)}%\n` +
        `💶 Kelly: ${stake.toFixed(2)}€ (${((pred.kellyStake || 0) * 100).toFixed(1)}%)\n\n` +
        `⚽ xG: ${pred.expectedHomeGoals.toFixed(1)} - ${pred.expectedAwayGoals.toFixed(1)}`

      await sendNotification(settings.userId, match.externalId, eventKey, msg)
    }
  }
}

// ===== MAIN LOOP =====

let isLiveMode = false

async function checkLiveMatches() {
  // Build user -> teamIds map
  const allFollowed = await prisma.followedTeam.findMany()
  const userMap = {}
  const allTeamIds = new Set()

  for (const ft of allFollowed) {
    if (!userMap[ft.userId]) userMap[ft.userId] = []
    userMap[ft.userId].push(ft.teamId)
    allTeamIds.add(ft.teamId)
  }

  if (allTeamIds.size === 0) return

  // Check for live matches
  const data = await footballApi('/matches?status=LIVE')
  if (!data) return

  const liveMatches = (data.matches || []).filter(m =>
    allTeamIds.has(m.homeTeam.id) || allTeamIds.has(m.awayTeam.id)
  )

  if (liveMatches.length > 0) {
    if (!isLiveMode) {
      console.log(`🔴 LIVE MODE: ${liveMatches.length} match(es) active!`)
      isLiveMode = true
    }

    for (const match of liveMatches) {
      await processMatch(match, allTeamIds, userMap)
    }
  } else {
    if (isLiveMode) {
      console.log('💤 No more live matches, back to idle')
      isLiveMode = false
    }
  }

  // Also process recently finished matches
  const todayStr = new Date().toISOString().split('T')[0]
  const finishedData = await footballApi(`/matches?status=FINISHED&dateFrom=${todayStr}&dateTo=${todayStr}`)
  if (finishedData) {
    const finishedMatches = (finishedData.matches || []).filter(m =>
      allTeamIds.has(m.homeTeam.id) || allTeamIds.has(m.awayTeam.id)
    )
    for (const match of finishedMatches) {
      await processMatch(match, allTeamIds, userMap)
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🏆 CompliAI Sport-Bot Worker starting...')
  console.log(`📡 Football API: ${FOOTBALL_API_KEY ? '✅ Key configured' : '❌ No key!'}`)
  console.log(`📊 Odds API: ${ODDS_API_KEY ? '✅ Key configured' : '⚠️ No key (value bets disabled)'}`)
  console.log(`📱 WAHA URL: ${WAHA_URL}`)
  console.log(`🗄️ Database: ${DATABASE_URL ? '✅ Connected' : '❌ No DB URL!'}`)

  // Initial sync
  await syncUpcomingMatches()
  await syncWhatsAppSessions()
  await updateTeamStats()
  await syncOddsAndPredict()

  let lastSyncTime = Date.now()
  let lastWaSyncTime = Date.now()
  let lastOddsSyncTime = Date.now()
  let lastStatsTime = Date.now()
  let loopCount = 0

  while (true) {
    try {
      loopCount++

      // Check live matches every 30 seconds
      await checkLiveMatches()

      // Check pre-match notifications every loop
      await checkPreMatchNotifications()

      // Sync WhatsApp sessions every 30 seconds
      if (Date.now() - lastWaSyncTime > 30000) {
        await syncWhatsAppSessions()
        lastWaSyncTime = Date.now()
      }

      // Re-sync schedule every 6 hours
      if (Date.now() - lastSyncTime > 6 * 60 * 60 * 1000) {
        await syncUpcomingMatches()
        lastSyncTime = Date.now()
      }

      // Recalculate team stats + ELO once per day (24h)
      if (Date.now() - lastStatsTime > 24 * 60 * 60 * 1000) {
        console.log('📊 Daily stats recalculation starting...')
        await updateTeamStats()
        lastStatsTime = Date.now()
      }

      // Sync odds twice per day (to conserve API credits — 500/month limit)
      // 8 leagues × 2 credits = 16 credits per sync × 2/day = 32/day ≈ 960/month
      // With free tier we need to be selective — only sync leagues with upcoming matches
      if (Date.now() - lastOddsSyncTime > 12 * 60 * 60 * 1000) {
        await syncOddsAndPredict()
        await updateBrierScores()
        await sendValueBetNotifications()
        lastOddsSyncTime = Date.now()
      }

      // Log status every 10 minutes
      if (loopCount % 20 === 0) {
        const followed = await prisma.followedTeam.count()
        const connected = await prisma.whatsAppSession.count({ where: { status: 'CONNECTED' } })
        console.log(`📊 Status: ${followed} teams followed, ${connected} WhatsApp connected, ${isLiveMode ? '🔴 LIVE' : '💤 idle'}`)
      }

      // Wait 30 seconds between checks
      await sleep(30000)
    } catch (err) {
      console.error('❌ Loop error:', err)
      await sleep(10000) // Wait 10s on error, then retry
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
