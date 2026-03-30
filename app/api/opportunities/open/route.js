import { NextResponse } from "next/server";
import { opportunities } from "@/lib/data";

export const dynamic = "force-dynamic";

function buildFallbackUrl(opportunity) {
  const query = opportunity
    ? `${opportunity.title} ${opportunity.category} official page`
    : "student opportunities official page";

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function isSupportedUrl(url) {
  return /^https?:\/\//i.test(String(url || ""));
}

function isLikelyReachable(status) {
  return (status >= 200 && status < 400) || [401, 403, 405, 429].includes(status);
}

async function validateLink(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
      headers: {
        "User-Agent": "LifeStack-Link-Validator/1.0",
      },
    });

    return isLikelyReachable(response.status);
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const opportunity = opportunities.find((item) => item.id === id);

  if (!opportunity || !isSupportedUrl(opportunity.link)) {
    return NextResponse.redirect(buildFallbackUrl(opportunity), 307);
  }

  const isHealthy = await validateLink(opportunity.link);

  if (isHealthy) {
    return NextResponse.redirect(opportunity.link, 307);
  }

  return NextResponse.redirect(buildFallbackUrl(opportunity), 307);
}
