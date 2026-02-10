import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendGenericEmail } from '@/lib/email';
import { z } from 'zod';

const magicLinkSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = magicLinkSchema.parse(body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Create user without password (magic link only)
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          emailVerified: new Date(),
        },
      });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiry: expiresAt,
      },
    });

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/api/flugtracker/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    await sendGenericEmail({
      to: email,
      subject: 'Ihr Login-Link für FlugTracker',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #0ea5e9, #2563eb); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">✈️</span>
              </div>
              <h1 style="color: #ffffff; font-size: 24px; margin-top: 16px; margin-bottom: 0;">FlugTracker</h1>
            </div>
            
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Klicken Sie auf den Button unten, um sich bei FlugTracker anzumelden. 
              Der Link ist 15 Minuten gültig.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLinkUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Jetzt anmelden
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
            </p>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;">
            
            <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
              Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
              <a href="${magicLinkUrl}" style="color: #0ea5e9; word-break: break-all;">${magicLinkUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Magic Link gesendet',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden des Links' },
      { status: 500 }
    );
  }
}
