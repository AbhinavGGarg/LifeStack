import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, authCookieOptions, verifyAuthToken } from "@/lib/auth";
import { deleteUserById, sanitizeUser, updateUserProfile } from "@/lib/userStore";

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
    const hasInterests = Object.prototype.hasOwnProperty.call(body || {}, "interests");
    const hasGoals = Object.prototype.hasOwnProperty.call(body || {}, "goals");
    const hasGpa = Object.prototype.hasOwnProperty.call(body || {}, "gpa");
    const hasActivityHours = Object.prototype.hasOwnProperty.call(body || {}, "activityHours");
    const hasExtracurriculars = Object.prototype.hasOwnProperty.call(
      body || {},
      "extracurriculars"
    );
    const hasIntendedMajor = Object.prototype.hasOwnProperty.call(body || {}, "intendedMajor");
    const hasMajorRecommendation = Object.prototype.hasOwnProperty.call(
      body || {},
      "majorRecommendation"
    );
    const hasTargetRole = Object.prototype.hasOwnProperty.call(body || {}, "targetRole");
    const hasOnboardingComplete = Object.prototype.hasOwnProperty.call(
      body || {},
      "onboardingComplete"
    );

    const interests = hasInterests ? normalizeInterests(body?.interests) : undefined;
    const goals = hasGoals ? String(body?.goals || "").trim() : undefined;
    const gpa = hasGpa ? normalizeOptionalNumber(body?.gpa) : undefined;
    const activityHours = hasActivityHours
      ? normalizeOptionalNumber(body?.activityHours)
      : undefined;
    const extracurriculars = hasExtracurriculars
      ? normalizeList(body?.extracurriculars)
      : undefined;
    const intendedMajor = hasIntendedMajor
      ? String(body?.intendedMajor || "").trim()
      : undefined;
    const majorRecommendation = hasMajorRecommendation
      ? String(body?.majorRecommendation || "").trim()
      : undefined;
    const targetRole = hasTargetRole ? String(body?.targetRole || "").trim() : undefined;
    const onboardingComplete =
      hasOnboardingComplete && typeof body?.onboardingComplete === "boolean"
        ? body.onboardingComplete
        : undefined;

    if (hasInterests && interests.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one interest." },
        { status: 400 }
      );
    }

    if (hasGoals && !goals) {
      return NextResponse.json(
        { error: "Goals cannot be empty." },
        { status: 400 }
      );
    }

    if (hasGpa && gpa !== null && (gpa < 0 || gpa > 4.0)) {
      return NextResponse.json(
        { error: "GPA must be between 0.0 and 4.0." },
        { status: 400 }
      );
    }

    if (
      hasActivityHours &&
      activityHours !== null &&
      (activityHours < 0 || activityHours > 80)
    ) {
      return NextResponse.json(
        { error: "Activity hours should be between 0 and 80 per week." },
        { status: 400 }
      );
    }

    const updates = {};

    if (hasInterests) updates.interests = interests;
    if (hasGoals) updates.goals = goals;
    if (hasGpa) updates.gpa = gpa;
    if (hasActivityHours) updates.activityHours = activityHours;
    if (hasExtracurriculars) updates.extracurriculars = extracurriculars;
    if (hasIntendedMajor) updates.intendedMajor = intendedMajor;
    if (hasMajorRecommendation) updates.majorRecommendation = majorRecommendation;
    if (hasTargetRole) updates.targetRole = targetRole;
    if (onboardingComplete !== undefined) updates.onboardingComplete = onboardingComplete;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid profile fields provided." },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfile(payload.sub, updates);

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

export async function DELETE() {
  try {
    const token = (await cookies()).get(authCookieName)?.value;
    const payload = await verifyAuthToken(token);

    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteUserById(payload.sub);

    if (!deleted) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(authCookieName, "", { ...authCookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Account delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete account right now." },
      { status: 500 }
    );
  }
}
