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

    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    // 1. Exchange code for tokens
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Accept: "application/json" 
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
       console.error("GitHub Token Error:", tokens);
       return NextResponse.json({ error: tokens.error_description }, { status: 400 });
    }

    const accessToken = tokens.access_token;

    // 2. Fetch User Profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const githubUser = await userResponse.json();

    // 3. Fetch Emails (GitHub might not return email in public profile if set to private)
    const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailResponse.json();
    
    // Find primary verified email
    const primaryEmailObj = emails.find((e: any) => e.primary && e.verified) || emails[0];
    const email = primaryEmailObj?.email;

    if (!email) {
        return NextResponse.json({ error: "No verified email found on GitHub account." }, { status: 400 });
    }
    
    const githubId = String(githubUser.id);
    const name = githubUser.name || githubUser.login;

    // 4. Find or Create User
    let user = await prisma.user.findUnique({
      where: { githubId },
    });

    if (!user) {
      // Check by email
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link GitHub ID
        user = await prisma.user.update({
             where: { id: user.id },
             data: { githubId },
        });
      }
    }

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          githubId,
          name,
          emailVerified: new Date(), // Trusted
        },
      });
    }

    // 5. Create Session
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
    console.error("GitHub Callback Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
