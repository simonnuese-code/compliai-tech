import { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
  isLoggedIn: boolean;
}

const sessionPassword =
  process.env.NODE_ENV === "production" && !process.env.SECRET_COOKIE_PASSWORD
    ? (() => { throw new Error("SECRET_COOKIE_PASSWORD is not set in production"); })()
    : process.env.SECRET_COOKIE_PASSWORD || "complex_password_at_least_32_characters_long";

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "compliai_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (session.isLoggedIn && session.user) {
    return session.user;
  }
  return null;
}
