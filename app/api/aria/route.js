import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { findUserById, sanitizeUser } from "@/lib/userStore";
import { getAriaReply } from "@/lib/ariaAssistant";

export async function POST(request) {
  try {
    const body = await request.json();
    const message = String(body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value || null;
    const authPayload = await verifyAuthToken(token);

    let user = null;
    if (authPayload?.sub) {
      const found = await findUserById(String(authPayload.sub));
      user = sanitizeUser(found);
    }

    const reply = await getAriaReply({
      message,
      history,
      user,
    });

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Unable to generate assistant response." }, { status: 500 });
  }
}
