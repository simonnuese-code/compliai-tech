import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`;

    // 1. Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Error:", tokens);
      return NextResponse.json({ error: "Failed to exchange token" }, { status: 400 });
    }

    // 2. Fetch User Profile
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userResponse.json();

    if (!userResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch user info" }, { status: 400 });
    }

    const email = googleUser.email;
    const googleId = googleUser.id;
    const name = googleUser.name || googleUser.email; // Fallback

    // 3. Find or Create User
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      // Check by email
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link Google ID
          user = await prisma.user.update({
             where: { id: user.id },
             data: { googleId },
          });
        }
      }
    }

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name,
          emailVerified: new Date(), // Trusted
        },
      });
    }

    // 4. Create Session
    const session = await getSession();
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/dashboard`);

  } catch (err) {
    console.error("Google Callback Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
