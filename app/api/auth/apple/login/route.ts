import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const CLIENT_ID = process.env.APPLE_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL}/api/auth/apple/callback`;
  
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Missing APPLE_CLIENT_ID" }, { status: 500 });
  }

  // Generate cryptographic random state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');

  const params = new URLSearchParams({
    response_type: "code",
    response_mode: "form_post",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "name email",
    state,
  });

  const url = `https://appleid.apple.com/auth/authorize?${params.toString()}`;

  const response = NextResponse.redirect(url);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
