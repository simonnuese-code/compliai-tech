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
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4'

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

  // Fetch matches for next 7 days
  const dateFrom = new Date().toISOString().split('T')[0]
  const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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

  console.log(`📅 Synced ${relevantMatches.length} matches`)
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
  const finishedData = await footballApi('/matches?status=FINISHED&dateFrom=' + new Date().toISOString().split('T')[0])
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
  console.log(`📱 WAHA URL: ${WAHA_URL}`)
  console.log(`🗄️ Database: ${DATABASE_URL ? '✅ Connected' : '❌ No DB URL!'}`)

  // Initial sync
  await syncUpcomingMatches()
  await syncWhatsAppSessions()

  let lastSyncTime = Date.now()
  let lastWaSyncTime = Date.now()
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
