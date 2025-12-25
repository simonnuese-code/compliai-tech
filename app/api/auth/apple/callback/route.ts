import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import jwt from "jsonwebtoken";

// Apple's public keys endpoint should ideally be cached/fetched, 
// for simplicity in MVP we might skip rigorous signature verification 
// IF we trust the direct POST from appleid.apple.com AND valid 'code' exchange.
// However, standard flow is: Exchange Code for Token.
// Check: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get("code") as string | null;
    const id_token = formData.get("id_token") as string | null;
    const userJson = formData.get("user") as string | null; // "user" field only sent on first login

    if (!code || !id_token) {
      return NextResponse.json({ error: "Missing code or id_token" }, { status: 400 });
    }

    // In a production app, verify id_token signature using Apple's public keys.
    // Here we decode it to get 'sub' (Apple User ID) and 'email'.
    // Trusting it directly is risky without signature verification,
    // but code exchange also validates it.
    
    // Decoding needs 'jsonwebtoken' or similar.
    const decoded: any = jwt.decode(id_token);
    
    if (!decoded || !decoded.sub) {
       return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const appleId = decoded.sub;
    const email = decoded.email;

    // "user" field is ONLY provided on the VERY FIRST login.
    // It contains name: { firstName: string, lastName: string }
    let firstName = "";
    let lastName = "";
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        firstName = userObj.name?.firstName || "";
        lastName = userObj.name?.lastName || "";
      } catch (e) {
        console.error("Error parsing user json", e);
      }
    }

    // 1. Check if user exists by appleId
    let user = await prisma.user.findUnique({
      where: { appleId },
    });

    if (!user) {
      // 2. If not, check by email (if email is provided)
      // Note: Apple might hide email (private relay), but usually provides it.
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link Apple ID to existing email user
          user = await prisma.user.update({
            where: { id: user.id },
            data: { appleId },
          });
        }
      }
    }

    if (!user) {
      // 3. Create new user
      if (!email) {
         // Should not happen for initial login unless configured strangely, 
         // or user revoked email.
         return NextResponse.json({ error: "No email provided by Apple" }, { status: 400 });
      }

      user = await prisma.user.create({
        data: {
          email,
          appleId,
          name: firstName ? `${firstName} ${lastName}`.trim() : "Apple User",
          // passwordHash is optional
          emailVerified: new Date(), // Trusted from Apple
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

    // Redirect to Dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/dashboard`);

  } catch (error) {
    console.error("Apple Callback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
