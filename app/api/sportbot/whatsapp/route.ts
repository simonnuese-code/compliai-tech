import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const WAHA_URL = process.env.WAHA_URL || 'http://167.235.59.89:3001'
const WAHA_API_KEY = process.env.WAHA_API_KEY || ''

function wahaHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {}),
  }
}

/** GET /api/sportbot/whatsapp — Get WhatsApp connection status + poll for QR */
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const wa = await prisma.whatsAppSession.findUnique({
    where: { userId: session.user.id },
  })

  if (!wa) {
    return NextResponse.json({ status: 'DISCONNECTED' })
  }

  // Poll WAHA for live status
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/${wa.sessionName}`, {
      headers: wahaHeaders(),
    })
    if (res.ok) {
      const data = await res.json()

      if (data.status === 'NOT_FOUND') {
        // Session was destroyed (QR timeout or manual) — update DB
        await prisma.whatsAppSession.update({
          where: { id: wa.id },
          data: { status: 'DISCONNECTED', qrCode: null },
        })
        return NextResponse.json({ status: 'DISCONNECTED' })
      }

      const newStatus = data.status === 'WORKING' ? 'CONNECTED'
        : data.status === 'SCAN_QR_CODE' ? 'QR_READY'
        : data.status === 'AUTHENTICATED' ? 'QR_READY'
        : 'DISCONNECTED'

      const phoneNumber = data.phoneNumber || wa.phoneNumber
      const qrCode = data.qr?.url || null

      // Update DB if status or phone changed
      if (newStatus !== wa.status || (phoneNumber && phoneNumber !== wa.phoneNumber)) {
        await prisma.whatsAppSession.update({
          where: { id: wa.id },
          data: {
            status: newStatus as 'CONNECTED' | 'QR_READY' | 'DISCONNECTED',
            ...(phoneNumber ? { phoneNumber } : {}),
            ...(newStatus === 'CONNECTED' ? { lastSeenAt: new Date(), qrCode: null } : {}),
            ...(qrCode ? { qrCode } : {}),
          },
        })
      }

      return NextResponse.json({
        status: newStatus,
        phoneNumber,
        qrCode,
      })
    }
  } catch {
    // WAHA not reachable — return DB state
  }

  return NextResponse.json({
    status: wa.status,
    phoneNumber: wa.phoneNumber,
    qrCode: wa.qrCode,
  })
}

/** POST /api/sportbot/whatsapp — Start WhatsApp session (force restart) */
export async function POST() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionName = `sportbot_${session.user.id.slice(0, 8)}`

  try {
    // First destroy any existing session to get a fresh QR
    try {
      await fetch(`${WAHA_URL}/api/sessions/${sessionName}`, {
        method: 'DELETE',
        headers: wahaHeaders(),
      })
    } catch {
      // OK if it doesn't exist
    }

    // Wait briefly for cleanup
    await new Promise(r => setTimeout(r, 1000))

    // Start fresh session
    const startRes = await fetch(`${WAHA_URL}/api/sessions/start`, {
      method: 'POST',
      headers: wahaHeaders(),
      body: JSON.stringify({ name: sessionName }),
    })

    if (!startRes.ok) {
      const errorText = await startRes.text()
      console.error('WAHA start error:', errorText)
      return NextResponse.json({ error: 'Failed to start WhatsApp session' }, { status: 500 })
    }

    const startData = await startRes.json()

    const status = startData.status === 'SCAN_QR_CODE' ? 'QR_READY' : 'DISCONNECTED'
    const qrCode = startData.qr || null

    // Save session to DB
    await prisma.whatsAppSession.upsert({
      where: { userId: session.user.id },
      update: {
        sessionName,
        status,
        qrCode,
      },
      create: {
        userId: session.user.id,
        sessionName,
        status,
        qrCode,
      },
    })

    return NextResponse.json({ status, qrCode })
  } catch (error) {
    console.error('WhatsApp connect error:', error)
    return NextResponse.json({ error: 'WhatsApp-Service nicht erreichbar' }, { status: 503 })
  }
}

/** DELETE /api/sportbot/whatsapp — Disconnect WhatsApp session */
export async function DELETE() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const wa = await prisma.whatsAppSession.findUnique({
    where: { userId: session.user.id },
  })

  if (wa) {
    // Destroy on WAHA
    try {
      await fetch(`${WAHA_URL}/api/sessions/${wa.sessionName}`, {
        method: 'DELETE',
        headers: wahaHeaders(),
      })
    } catch {
      // OK
    }

    // Update DB
    await prisma.whatsAppSession.update({
      where: { id: wa.id },
      data: { status: 'DISCONNECTED', qrCode: null, phoneNumber: null },
    })
  }

  return NextResponse.json({ status: 'DISCONNECTED' })
}
