import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { sanitizeUser, updateUserProfile } from "@/lib/userStore";

function normalizeInterests(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }

  return String(raw || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeOptionalNumber(raw) {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function normalizeList(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(raw || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function PATCH(request) {
  try {
    const token = (await cookies()).get(authCookieName)?.value;
    const payload = await verifyAuthToken(token);

    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const interests = normalizeInterests(body?.interests);
    const goals = String(body?.goals || "").trim();
    const gpa = normalizeOptionalNumber(body?.gpa);
    const activityHours = normalizeOptionalNumber(body?.activityHours);
    const extracurriculars = normalizeList(body?.extracurriculars);
    const intendedMajor = String(body?.intendedMajor || "").trim();
    const targetRole = String(body?.targetRole || "").trim();
    const onboardingComplete =
      typeof body?.onboardingComplete === "boolean"
        ? body.onboardingComplete
        : undefined;

    if (interests.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one interest." },
        { status: 400 }
      );
    }

    if (!goals) {
      return NextResponse.json(
        { error: "Goals cannot be empty." },
        { status: 400 }
      );
    }

    if (gpa !== null && (gpa < 0 || gpa > 4.0)) {
      return NextResponse.json(
        { error: "GPA must be between 0.0 and 4.0." },
        { status: 400 }
      );
    }

    if (activityHours !== null && (activityHours < 0 || activityHours > 80)) {
      return NextResponse.json(
        { error: "Activity hours should be between 0 and 80 per week." },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfile(payload.sub, {
      interests,
      goals,
      gpa,
      activityHours,
      extracurriculars,
      intendedMajor,
      targetRole,
      onboardingComplete,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: "Unable to update profile right now." },
      { status: 500 }
    );
  }
}
