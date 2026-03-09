import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const WAHA_URL = process.env.WAHA_URL || 'http://167.235.59.89:3001'
const WAHA_API_KEY = process.env.WAHA_API_KEY || ''

/** GET /api/sportbot/whatsapp — Get WhatsApp connection status */
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

  // Check actual status from WAHA
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/${wa.sessionName}`, {
      headers: { 'X-Api-Key': WAHA_API_KEY },
    })
    if (res.ok) {
      const data = await res.json()
      const newStatus = data.status === 'WORKING' ? 'CONNECTED'
        : data.status === 'SCAN_QR_CODE' ? 'QR_READY'
        : 'DISCONNECTED'

      if (newStatus !== wa.status) {
        await prisma.whatsAppSession.update({
          where: { id: wa.id },
          data: { 
            status: newStatus as 'CONNECTED' | 'QR_READY' | 'DISCONNECTED',
            ...(newStatus === 'CONNECTED' ? { lastSeenAt: new Date() } : {}),
          },
        })
      }

      return NextResponse.json({
        status: newStatus,
        phoneNumber: wa.phoneNumber,
        qrCode: data.status === 'SCAN_QR_CODE' ? data.qr?.url : null,
      })
    }
  } catch {
    // WAHA not reachable
  }

  return NextResponse.json({
    status: wa.status,
    phoneNumber: wa.phoneNumber,
  })
}

/** POST /api/sportbot/whatsapp — Start WhatsApp session (create or restart) */
export async function POST() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionName = `sportbot_${session.user.id.slice(0, 8)}`

  try {
    // Create or start WAHA session
    const startRes = await fetch(`${WAHA_URL}/api/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY,
      },
      body: JSON.stringify({
        name: sessionName,
        config: {
          webhooks: [{
            url: `${process.env.NEXT_PUBLIC_URL || 'https://compliai.tech'}/api/sportbot/whatsapp/webhook`,
            events: ['session.status'],
          }],
        },
      }),
    })

    if (!startRes.ok) {
      const errorText = await startRes.text()
      console.error('WAHA start error:', errorText)
      return NextResponse.json({ error: 'Failed to start WhatsApp session' }, { status: 500 })
    }

    const startData = await startRes.json()

    // Save session to DB
    await prisma.whatsAppSession.upsert({
      where: { userId: session.user.id },
      update: {
        sessionName,
        status: startData.status === 'SCAN_QR_CODE' ? 'QR_READY' : 'DISCONNECTED',
        qrCode: startData.qr?.url || null,
      },
      create: {
        userId: session.user.id,
        sessionName,
        status: startData.status === 'SCAN_QR_CODE' ? 'QR_READY' : 'DISCONNECTED',
        qrCode: startData.qr?.url || null,
      },
    })

    // Get QR code
    if (startData.status === 'SCAN_QR_CODE') {
      return NextResponse.json({
        status: 'QR_READY',
        qrCode: startData.qr?.url,
      })
    }

    // Try to get QR code separately
    const qrRes = await fetch(`${WAHA_URL}/api/sessions/${sessionName}/auth/qr`, {
      headers: { 'X-Api-Key': WAHA_API_KEY },
    })

    if (qrRes.ok) {
      const qrData = await qrRes.json()
      await prisma.whatsAppSession.update({
        where: { userId: session.user.id },
        data: { qrCode: qrData.url, status: 'QR_READY' },
      })
      return NextResponse.json({
        status: 'QR_READY',
        qrCode: qrData.url,
      })
    }

    return NextResponse.json({ status: 'DISCONNECTED', message: 'Session started, waiting for QR' })
  } catch (error) {
    console.error('WhatsApp connect error:', error)
    return NextResponse.json({ error: 'WAHA service not reachable' }, { status: 503 })
  }
}
