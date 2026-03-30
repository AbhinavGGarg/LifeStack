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

    const updatedUser = await updateUserProfile(payload.sub, { interests, goals });

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
