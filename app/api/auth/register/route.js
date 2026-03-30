import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authCookieName, authCookieOptions, createAuthToken } from "@/lib/auth";
import { createUser, findUserByEmail, sanitizeUser } from "@/lib/userStore";

const VALID_GRADES = ["9", "10", "11", "12", "college"];

function normalizeInterests(interests) {
  if (Array.isArray(interests)) {
    return interests
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean);
  }

  return String(interests || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "");
    const profile = {
      name: String(body?.name || "").trim(),
      grade: String(body?.grade || "").trim().toLowerCase(),
      interests: normalizeInterests(body?.interests),
      goals: String(body?.goals || "").trim(),
      gpa: null,
      activityHours: null,
      extracurriculars: [],
      intendedMajor: "",
      majorRecommendation: "",
      targetRole: "",
      onboardingComplete: false,
    };

    if (!email || !password || !profile.name || !profile.grade) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!VALID_GRADES.includes(profile.grade)) {
      return NextResponse.json(
        { error: "Invalid grade value." },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, profile });
    const token = await createAuthToken(user);

    const response = NextResponse.json({ user: sanitizeUser(user) });
    response.cookies.set(authCookieName, token, authCookieOptions);
    return response;
  } catch (error) {
    console.error("Register route failed:", error);
    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 }
    );
  }
}
