/**
 * CompliAI WhatsApp Bridge
 * ========================
 * Lightweight WhatsApp Web bridge using whatsapp-web.js
 * Runs on Hetzner as a REST API on port 3001
 *
 * Endpoints:
 *   POST /api/sessions/start    - Start a new session, returns QR code
 *   GET  /api/sessions/:name    - Get session status
 *   GET  /api/sessions/:name/auth/qr - Get QR code
 *   DELETE /api/sessions/:name  - Stop and destroy a session
 *   POST /api/sendText          - Send a text message
 *   GET  /health                - Health check
 */

const http = require('http')
const { Client, LocalAuth } = require('whatsapp-web.js')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
const PORT = process.env.WA_BRIDGE_PORT || 3001
const QR_TIMEOUT_MS = 120000 // 2 minutes — destroy session if QR not scanned

// Keep DB connection warm — Neon cold starts can add 1-2s to first query
setInterval(async () => {
  try { await prisma.$queryRaw`SELECT 1` } catch {}
}, 30000) // ping every 30s

// Prevent unhandled errors from crashing the process
// whatsapp-web.js throws "Execution context was destroyed" during auth navigation
process.on('uncaughtException', err => {
  console.error('⚠️ Uncaught exception (non-fatal):', err.message)
})
process.on('unhandledRejection', err => {
  console.error('⚠️ Unhandled rejection (non-fatal):', err?.message || err)
})
const sessions = new Map() // sessionName -> { client, status, qr, phoneNumber, qrTimer }

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function destroySession(name) {
  const session = sessions.get(name)
  if (!session) return
  if (session.qrTimer) clearTimeout(session.qrTimer)
  try { await session.client.destroy() } catch {}
  sessions.delete(name)
  console.log(`🗑️ [${name}] Session destroyed`)
}

async function startSession(name) {
  // If already connected, just return status
  if (sessions.has(name)) {
    const existing = sessions.get(name)
    if (existing.status === 'WORKING') {
      return { status: 'WORKING', phoneNumber: existing.phoneNumber }
    }
    // Destroy stale session before restarting
    await destroySession(name)
  }

  const sessionData = {
    client: null,
    status: 'STARTING',
    qr: null,
    qrCount: 0,
    phoneNumber: null,
    qrTimer: null,
  }
  sessions.set(name, sessionData)

  const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/snap/bin/chromium'
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: name, dataPath: '/opt/whatsapp-sessions' }),
    puppeteer: {
      headless: true,
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
      ],
    },
  })

  sessionData.client = client

  client.on('qr', qr => {
    sessionData.qrCount++
    console.log(`📱 [${name}] QR code received (#${sessionData.qrCount})`)
    sessionData.qr = qr
    sessionData.status = 'SCAN_QR_CODE'

    // Reset QR timeout — if nobody scans within 2 min, destroy
    if (sessionData.qrTimer) clearTimeout(sessionData.qrTimer)
    sessionData.qrTimer = setTimeout(async () => {
      if (sessionData.status === 'SCAN_QR_CODE') {
        console.log(`⏰ [${name}] QR timeout — no scan in ${QR_TIMEOUT_MS / 1000}s, destroying session`)
        await destroySession(name)
      }
    }, QR_TIMEOUT_MS)
  })

  client.on('ready', async () => {
    console.log(`✅ [${name}] WhatsApp connected!`)
    sessionData.status = 'WORKING'
    sessionData.qr = null
    if (sessionData.qrTimer) { clearTimeout(sessionData.qrTimer); sessionData.qrTimer = null }
    const info = client.info
    if (info?.wid?.user) {
      sessionData.phoneNumber = info.wid.user
      console.log(`📱 [${name}] Phone: +${info.wid.user}`)

      // Send welcome message
      try {
        await client.sendMessage(`${info.wid.user}@c.us`,
          '⚽ *CompliAI Sport-Bot verbunden!*\n\n' +
          'Du erhältst ab jetzt Live-Benachrichtigungen für deine Teams:\n' +
          '📢 Vor Spielbeginn\n' +
          '⚽ Tore in Echtzeit\n' +
          '⏸️ Halbzeit & Abpfiff\n' +
          '🟥 Rote Karten\n' +
          '💰 Value Bet Alerts\n\n' +
          '*Schreib mir jederzeit:*\n' +
          '📊 *ergebnisse* — Letzte 7 Tage\n' +
          '🔴 *live* — Aktuelle Spiele\n' +
          '📅 *nächste* — Kommende Spiele\n' +
          '💰 *wetten* — Value Bets & Quoten\n' +
          '❓ *hilfe* — Alle Befehle\n\n' +
          'Teams verwalten: compliai.tech/hub/sportbot'
        )
        console.log(`📱 [${name}] Welcome message sent`)
      } catch (err) {
        console.error(`📱 [${name}] Welcome message failed:`, err.message)
      }
    }
  })

  // Cache userId for fast message handling (avoids DB lookup on every message)
  let cachedUserId = null

  // Handle incoming messages — reply with match results
  client.on('message', async msg => {
    // Only respond to messages from the connected user (to themselves)
    if (!sessionData.phoneNumber) return
    const fromMe = msg.from === `${sessionData.phoneNumber}@c.us` || msg.fromMe
    if (!fromMe) return

    const text = (msg.body || '').trim().toLowerCase()
    if (!text) return

    // Check if it's a known command before doing any DB work
    const commands = ['ergebnisse', 'results', 'spiele', 'scores', 'live', 'next', 'nächste', 'kommende', 'wetten', 'value', 'bets', 'tipps', 'hilfe', 'help', '?']
    if (!commands.includes(text)) return

    console.log(`💬 [${name}] Message received: "${text}"`)

    // Send typing indicator immediately for perceived speed
    try {
      const chat = await msg.getChat()
      await chat.sendStateTyping()
    } catch {}

    try {
      // Use cached userId or look up once
      if (!cachedUserId) {
        const waSession = await prisma.whatsAppSession.findFirst({
          where: { sessionName: name },
        })
        if (!waSession) return
        cachedUserId = waSession.userId
      }
      const userId = cachedUserId

      if (text === 'ergebnisse' || text === 'results' || text === 'spiele' || text === 'scores') {
        await handleResultsCommand(client, msg, userId)
      } else if (text === 'live') {
        await handleLiveCommand(client, msg, userId)
      } else if (text === 'next' || text === 'nächste' || text === 'kommende') {
        await handleUpcomingCommand(client, msg, userId)
      } else if (text === 'wetten' || text === 'value' || text === 'bets' || text === 'tipps') {
        await handleValueBetsCommand(client, msg, userId)
      } else if (text === 'hilfe' || text === 'help' || text === '?') {
        await msg.reply(
          '⚽ *Sport-Bot Befehle*\n\n' +
          '📊 *ergebnisse* — Ergebnisse der letzten 7 Tage\n' +
          '🔴 *live* — Aktuelle Live-Spiele\n' +
          '📅 *nächste* — Kommende Spiele\n' +
          '💰 *wetten* — Value Bets & Quoten\n' +
          '❓ *hilfe* — Diese Hilfe anzeigen'
        )
      }
    } catch (err) {
      console.error(`💬 [${name}] Message handler error:`, err.message)
    }
  })

  client.on('authenticated', () => {
    console.log(`🔐 [${name}] Authenticated`)
    sessionData.status = 'AUTHENTICATED'
    if (sessionData.qrTimer) { clearTimeout(sessionData.qrTimer); sessionData.qrTimer = null }
  })

  client.on('disconnected', reason => {
    console.log(`❌ [${name}] Disconnected: ${reason}`)
    if (sessionData.qrTimer) clearTimeout(sessionData.qrTimer)
    sessionData.status = 'DISCONNECTED'
    sessions.delete(name)
  })

  client.on('auth_failure', msg => {
    console.error(`🔒 [${name}] Auth failed: ${msg}`)
    if (sessionData.qrTimer) clearTimeout(sessionData.qrTimer)
    sessionData.status = 'FAILED'
  })

  // initialize() can throw during WhatsApp Web navigation — catch and keep running
  try {
    await client.initialize()
  } catch (err) {
    console.error(`⚠️ [${name}] Initialize error (may recover):`, err.message)
  }

  // Wait briefly for QR to arrive
  if (sessionData.status === 'STARTING') {
    await new Promise(r => setTimeout(r, 5000))
  }

  return { status: sessionData.status, qr: sessionData.qr }
}

// ===== CHAT COMMAND HANDLERS =====

async function handleResultsCommand(client, msg, userId) {
  const followedTeams = await prisma.followedTeam.findMany({
    where: { userId },
    select: { teamId: true, teamName: true },
  })

  if (followedTeams.length === 0) {
    await msg.reply('Du folgst noch keinen Teams. Füge Teams auf compliai.tech/hub/sportbot/teams hinzu.')
    return
  }

  const teamIds = followedTeams.map(t => t.teamId)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const matches = await prisma.sportMatch.findMany({
    where: {
      status: 'FINISHED',
      utcDate: { gte: sevenDaysAgo },
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    orderBy: { utcDate: 'desc' },
    take: 15,
  })

  if (matches.length === 0) {
    await msg.reply('📊 Keine Ergebnisse in den letzten 7 Tagen für deine Teams.')
    return
  }

  let reply = '📊 *Ergebnisse der letzten 7 Tage*\n'

  for (const m of matches) {
    const date = new Date(m.utcDate).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    const home = m.homeTeamName.length > 15 ? m.homeTeamName.slice(0, 15) : m.homeTeamName
    const away = m.awayTeamName.length > 15 ? m.awayTeamName.slice(0, 15) : m.awayTeamName
    reply += `\n${date}: ${home} *${m.homeScoreFullTime ?? '-'}:${m.awayScoreFullTime ?? '-'}* ${away}`
    if (m.competitionName) reply += ` _(${m.competitionName})_`
  }

  await msg.reply(reply)
}

async function handleLiveCommand(client, msg, userId) {
  const followedTeams = await prisma.followedTeam.findMany({
    where: { userId },
    select: { teamId: true },
  })

  const teamIds = followedTeams.map(t => t.teamId)

  const matches = await prisma.sportMatch.findMany({
    where: {
      status: { in: ['IN_PLAY', 'PAUSED'] },
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    orderBy: { utcDate: 'asc' },
  })

  if (matches.length === 0) {
    await msg.reply('🔴 Aktuell läuft kein Spiel deiner Teams.')
    return
  }

  let reply = '🔴 *Live-Spiele*\n'
  for (const m of matches) {
    const status = m.status === 'PAUSED' ? '⏸️ HZ' : `${m.minute || ''}\'`
    reply += `\n${status} ${m.homeTeamName} *${m.homeScoreFullTime ?? 0}:${m.awayScoreFullTime ?? 0}* ${m.awayTeamName}`
  }

  await msg.reply(reply)
}

async function handleUpcomingCommand(client, msg, userId) {
  const followedTeams = await prisma.followedTeam.findMany({
    where: { userId },
    select: { teamId: true },
  })

  const teamIds = followedTeams.map(t => t.teamId)

  const matches = await prisma.sportMatch.findMany({
    where: {
      status: { in: ['SCHEDULED', 'TIMED'] },
      utcDate: { gte: new Date() },
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    orderBy: { utcDate: 'asc' },
    take: 10,
  })

  if (matches.length === 0) {
    await msg.reply('📅 Keine kommenden Spiele für deine Teams in den nächsten Tagen.')
    return
  }

  let reply = '📅 *Kommende Spiele*\n'
  for (const m of matches) {
    const d = new Date(m.utcDate)
    const date = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
    reply += `\n${date} ${time}: ${m.homeTeamName} vs ${m.awayTeamName}`
    if (m.competitionName) reply += ` _(${m.competitionName})_`
  }

  await msg.reply(reply)
}

async function handleValueBetsCommand(client, msg, userId) {
  const followedTeams = await prisma.followedTeam.findMany({
    where: { userId },
    select: { teamId: true },
  })

  if (followedTeams.length === 0) {
    await msg.reply('Du folgst noch keinen Teams. Füge Teams auf compliai.tech/hub/sportbot/teams hinzu.')
    return
  }

  const teamIds = followedTeams.map(t => t.teamId)

  // Get upcoming matches with predictions
  const matches = await prisma.sportMatch.findMany({
    where: {
      status: { in: ['SCHEDULED', 'TIMED'] },
      utcDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    orderBy: { utcDate: 'asc' },
    take: 10,
  })

  if (matches.length === 0) {
    await msg.reply('💰 Keine kommenden Spiele mit Quoten für deine Teams.')
    return
  }

  const marketNames = { home: '1', draw: 'X', away: '2', over25: 'Ü2.5', under25: 'U2.5' }
  let reply = '💰 *Value Bets — Deine Teams*\n'

  for (const m of matches) {
    const pred = await prisma.matchPrediction.findUnique({
      where: { matchExternalId: m.externalId },
    })

    const d = new Date(m.utcDate)
    const date = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
    const home = m.homeTeamName.length > 12 ? m.homeTeamName.slice(0, 12) : m.homeTeamName
    const away = m.awayTeamName.length > 12 ? m.awayTeamName.slice(0, 12) : m.awayTeamName

    reply += `\n${date} ${time}\n${home} vs ${away}`

    if (pred) {
      reply += `\n📊 ${(pred.homeWinProb * 100).toFixed(0)}% / ${(pred.drawProb * 100).toFixed(0)}% / ${(pred.awayWinProb * 100).toFixed(0)}%`
      reply += ` | xG ${pred.expectedHomeGoals.toFixed(1)}-${pred.expectedAwayGoals.toFixed(1)}`

      if (pred.bestValueMarket && pred.bestValueEV > 0) {
        reply += `\n✅ *${marketNames[pred.bestValueMarket] || pred.bestValueMarket}* @ ${pred.bestValueOdds?.toFixed(2)} (${pred.bestValueBookmaker}) EV +${(pred.bestValueEV * 100).toFixed(1)}%`
      } else {
        reply += `\n⚪ Kein Value Bet`
      }
    } else {
      reply += `\n⏳ Noch keine Analyse`
    }
  }

  // Add model performance
  const scoredPreds = await prisma.matchPrediction.aggregate({
    where: { brierScore: { not: null } },
    _avg: { brierScore: true },
    _count: true,
  })
  if (scoredPreds._count > 0) {
    reply += `\n\n📈 Modell-Genauigkeit: ${(scoredPreds._avg.brierScore * 100).toFixed(1)} Brier (${scoredPreds._count} Spiele)`
  }

  await msg.reply(reply)
}

async function sendText(sessionName, chatId, text) {
  const session = sessions.get(sessionName)
  if (!session || session.status !== 'WORKING') {
    throw new Error(`Session ${sessionName} not connected`)
  }
  await session.client.sendMessage(chatId, text)
  return { success: true }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key')

  if (req.method === 'OPTIONS') {
    respond(res, 200, {})
    return
  }

  try {
    // POST /api/sessions/start
    if (path === '/api/sessions/start' && req.method === 'POST') {
      const body = await parseBody(req)
      const name = body.name || 'default'
      const result = await startSession(name)
      respond(res, 200, result)
      return
    }

    // DELETE /api/sessions/:name — stop and destroy session
    const deleteMatch = path.match(/^\/api\/sessions\/([^/]+)$/)
    if (deleteMatch && req.method === 'DELETE') {
      const name = deleteMatch[1]
      await destroySession(name)
      respond(res, 200, { status: 'DESTROYED' })
      return
    }

    // GET /api/sessions/:name
    const sessionMatch = path.match(/^\/api\/sessions\/([^/]+)$/)
    if (sessionMatch && req.method === 'GET') {
      const name = sessionMatch[1]
      const session = sessions.get(name)
      if (!session) {
        respond(res, 200, { status: 'NOT_FOUND' })
        return
      }
      respond(res, 200, {
        status: session.status,
        phoneNumber: session.phoneNumber,
        qr: session.qr ? { url: session.qr } : null,
      })
      return
    }

    // GET /api/sessions/:name/auth/qr
    const qrMatch = path.match(/^\/api\/sessions\/([^/]+)\/auth\/qr$/)
    if (qrMatch && req.method === 'GET') {
      const name = qrMatch[1]
      const session = sessions.get(name)
      if (!session || !session.qr) {
        respond(res, 404, { error: 'No QR available' })
        return
      }
      respond(res, 200, { url: session.qr })
      return
    }

    // POST /api/sendText
    if (path === '/api/sendText' && req.method === 'POST') {
      const body = await parseBody(req)
      const { session: sessionName, chatId, text } = body
      const result = await sendText(sessionName || 'default', chatId, text)
      respond(res, 200, result)
      return
    }

    // Health check
    if (path === '/health') {
      const sessionList = []
      for (const [name, data] of sessions) {
        sessionList.push({ name, status: data.status, phone: data.phoneNumber })
      }
      respond(res, 200, { ok: true, sessions: sessionList })
      return
    }

    respond(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('Request error:', err)
    respond(res, 500, { error: err.message })
  }
})

server.listen(PORT, async () => {
  console.log(`📱 WhatsApp Bridge listening on port ${PORT}`)

  // Auto-restore sessions from DB on startup (any session with a phone number has been connected before)
  try {
    const savedSessions = await prisma.whatsAppSession.findMany({
      where: { phoneNumber: { not: null } },
    })
    for (const wa of savedSessions) {
      console.log(`🔄 Auto-restoring session: ${wa.sessionName}`)
      try {
        await startSession(wa.sessionName)
      } catch (err) {
        console.error(`⚠️ Failed to restore ${wa.sessionName}:`, err.message)
      }
    }
    if (savedSessions.length > 0) {
      console.log(`🔄 Restored ${savedSessions.length} session(s)`)
    }
  } catch (err) {
    console.error('⚠️ Session restore failed:', err.message)
  }
})
