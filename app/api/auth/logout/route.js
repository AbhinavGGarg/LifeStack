import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(authCookieName, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
