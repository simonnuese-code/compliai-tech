/**
 * CompliAI WhatsApp Bridge
 * ========================
 * Lightweight WhatsApp Web bridge using whatsapp-web.js
 * Runs on Hetzner as a REST API on port 3001
 * 
 * Endpoints:
 *   POST /api/sessions/start   - Start a new session, returns QR code
 *   GET  /api/sessions/:name   - Get session status
 *   GET  /api/sessions/:name/auth/qr - Get QR code as data URL
 *   POST /api/sendText          - Send a text message
 */

const http = require('http')
const { Client, LocalAuth } = require('whatsapp-web.js')

const PORT = process.env.WA_BRIDGE_PORT || 3001
const sessions = new Map() // sessionName -> { client, status, qr }

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

async function startSession(name) {
  if (sessions.has(name)) {
    const session = sessions.get(name)
    if (session.status === 'WORKING') {
      return { status: 'WORKING' }
    }
    // Destroy old session and restart
    try { await session.client.destroy() } catch {}
  }

  const sessionData = {
    client: null,
    status: 'STARTING',
    qr: null,
    phoneNumber: null,
  }
  sessions.set(name, sessionData)

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: name, dataPath: '/opt/whatsapp-sessions' }),
    puppeteer: {
      headless: true,
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
    console.log(`📱 [${name}] QR code received`)
    sessionData.qr = qr
    sessionData.status = 'SCAN_QR_CODE'
  })

  client.on('ready', () => {
    console.log(`✅ [${name}] WhatsApp connected!`)
    sessionData.status = 'WORKING'
    sessionData.qr = null
    // Get phone number
    const info = client.info
    if (info?.wid?.user) {
      sessionData.phoneNumber = info.wid.user
      console.log(`📱 [${name}] Phone: ${info.wid.user}`)
    }
  })

  client.on('authenticated', () => {
    console.log(`🔐 [${name}] Authenticated`)
    sessionData.status = 'AUTHENTICATED'
  })

  client.on('disconnected', reason => {
    console.log(`❌ [${name}] Disconnected: ${reason}`)
    sessionData.status = 'DISCONNECTED'
    sessions.delete(name)
  })

  client.on('auth_failure', msg => {
    console.error(`🔒 [${name}] Auth failed: ${msg}`)
    sessionData.status = 'FAILED'
  })

  await client.initialize()
  return { status: sessionData.status, qr: sessionData.qr }
}

async function sendText(sessionName, chatId, text) {
  const session = sessions.get(sessionName)
  if (!session || session.status !== 'WORKING') {
    throw new Error(`Session ${sessionName} not connected`)
  }
  await session.client.sendMessage(chatId, text)
  return { success: true }
}

// QR Code to Data URL converter
function qrToDataUrl(qrText) {
  // Return the raw QR string - frontend can render it
  return qrText
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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
        qr: session.qr ? { url: qrToDataUrl(session.qr) } : null,
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
      respond(res, 200, { url: qrToDataUrl(session.qr) })
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

server.listen(PORT, () => {
  console.log(`📱 WhatsApp Bridge listening on port ${PORT}`)
})
