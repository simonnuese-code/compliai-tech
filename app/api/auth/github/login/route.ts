import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL}/api/auth/github/callback`;
  
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Missing GITHUB_CLIENT_ID" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "user:email", // Request read access to user emails
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
