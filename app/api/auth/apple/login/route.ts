import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const CLIENT_ID = process.env.APPLE_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL}/api/auth/apple/callback`;
  
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Missing APPLE_CLIENT_ID" }, { status: 500 });
  }

  const params = new URLSearchParams({
    response_type: "code", // Apple returns an authorization code
    response_mode: "form_post", // Apple sends POST to callback
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "name email", // Request name and email
    state: "apple_auth_state", // Ideally use a random state for security
  });

  const url = `https://appleid.apple.com/auth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
