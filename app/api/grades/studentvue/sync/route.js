import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { findUserById, sanitizeUser } from "@/lib/userStore";
import { fetchStudentVueGrades } from "@/lib/studentVue";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value || null;
    const authPayload = await verifyAuthToken(token);

    if (!authPayload?.sub) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await findUserById(String(authPayload.sub));
    if (!sanitizeUser(user)) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await request.json();
    const portalUrl = String(body?.portalUrl || "").trim();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    const snapshot = await fetchStudentVueGrades({
      portalUrl,
      username,
      password,
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Unable to sync grades right now.",
      },
      { status: 400 }
    );
  }
}
