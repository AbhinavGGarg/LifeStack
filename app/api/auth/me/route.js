import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { findUserById, sanitizeUser } from "@/lib/userStore";

export async function GET() {
  try {
    const token = (await cookies()).get(authCookieName)?.value;
    const payload = await verifyAuthToken(token);

    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserById(payload.sub);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Me route failed:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
