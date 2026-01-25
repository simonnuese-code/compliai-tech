import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/flugtracker/login?error=invalid_link', request.url)
      );
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/flugtracker/login?error=expired_link', request.url)
      );
    }

    // Clear token and verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
    });

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    await session.save();

    // Redirect to dashboard
    return NextResponse.redirect(
      new URL('/flugtracker/dashboard', request.url)
    );
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(
      new URL('/flugtracker/login?error=verification_failed', request.url)
    );
  }
}
