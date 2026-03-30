import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authCookieName, authCookieOptions, createAuthToken } from "@/lib/auth";
import { findUserByEmail, sanitizeUser } from "@/lib/userStore";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createAuthToken(user);

    const response = NextResponse.json({ user: sanitizeUser(user) });
    response.cookies.set(authCookieName, token, authCookieOptions);
    return response;
  } catch (error) {
    console.error("Login route failed:", error);
    return NextResponse.json(
      { error: "Unable to login right now." },
      { status: 500 }
    );
  }
}
