import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { error: 'E-Mail-Adresse ist erforderlich' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // We don't want to reveal if a user exists or not for security reasons
        // But for this MVP/internal tool, we might want to be helpful or just return success always
        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ success: true })
        }

        // Generate token
        const token = randomBytes(32).toString('hex')
        const expiry = new Date(Date.now() + 3600000) // 1 hour

        // Save token to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry
            }
        })

        // Get origin from request to ensure correct link generation (localhost vs production)
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Send email
        await sendPasswordResetEmail(user.email, token, user.name || 'Nutzer', origin)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        )
    }
}
