import { NextResponse } from "next/server";
import { getOpportunityRecommendation } from "@/lib/recommendation";

export async function POST(request) {
  try {
    const body = await request.json();
    const user = body?.user;
    const opportunity = body?.opportunity;

    if (!user || !opportunity) {
      return NextResponse.json(
        { error: "User and opportunity are required." },
        { status: 400 }
      );
    }

    const recommendation = await getOpportunityRecommendation(user, opportunity);

    return NextResponse.json({ recommendation });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate recommendation." },
      { status: 500 }
    );
  }
}
