import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, verifyAuthToken } from "@/lib/auth";

function normalizePortalUrl(input) {
  const raw = String(input || "").trim();

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function parsePercentFromMark(mark) {
  const raw = Number(mark?.calculatedScore?.raw);
  if (Number.isFinite(raw)) {
    return Math.max(0, Math.min(100, raw));
  }

  const formatted = String(mark?.calculatedScore?.string || "").trim();
  if (!formatted) {
    return null;
  }

  const numeric = Number(formatted.replace(/[^0-9.]+/g, ""));
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 100) {
    return numeric;
  }

  const letter = formatted.toUpperCase();
  if (letter.startsWith("A+")) return 99;
  if (letter.startsWith("A")) return 95;
  if (letter.startsWith("B+")) return 88;
  if (letter.startsWith("B")) return 85;
  if (letter.startsWith("C+")) return 78;
  if (letter.startsWith("C")) return 75;
  if (letter.startsWith("D+")) return 68;
  if (letter.startsWith("D")) return 65;
  if (letter.startsWith("F")) return 55;

  return null;
}

function extractCoursesFromGradebook(gradebook) {
  const courses = Array.isArray(gradebook?.courses) ? gradebook.courses : [];
  const periodName = String(gradebook?.reportingPeriod?.current?.name || "").toLowerCase();

  const mapped = courses
    .map((course) => {
      const marks = Array.isArray(course?.marks) ? course.marks : [];

      const exactPeriod = marks.find((mark) =>
        String(mark?.name || "").toLowerCase().includes(periodName)
      );

      const gradeMark =
        exactPeriod ||
        marks.find((mark) => Number.isFinite(Number(mark?.calculatedScore?.raw))) ||
        marks.find((mark) => parsePercentFromMark(mark) !== null) ||
        null;

      const grade = parsePercentFromMark(gradeMark);
      const name = String(course?.title || "").trim();

      if (!name || grade === null) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        name,
        grade: Number(grade.toFixed(2)),
        target: 90,
      };
    })
    .filter(Boolean);

  const byName = new Map();
  mapped.forEach((course) => {
    const key = course.name.toLowerCase();
    const existing = byName.get(key);

    if (!existing || course.grade > existing.grade) {
      byName.set(key, course);
    }
  });

  return Array.from(byName.values());
}

export async function POST(request) {
  try {
    const token = (await cookies()).get(authCookieName)?.value;
    const payload = await verifyAuthToken(token);

    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const portalUrl = normalizePortalUrl(body?.portalUrl);
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    if (!portalUrl || !username || !password) {
      return NextResponse.json(
        { error: "Portal URL, username, and password are required." },
        { status: 400 }
      );
    }

    let parsedPortal;
    try {
      parsedPortal = new URL(portalUrl);
    } catch {
      return NextResponse.json(
        { error: "Portal URL is invalid. Paste your StudentVUE link." },
        { status: 400 }
      );
    }

    const studentVueModule = await import("studentvue");
    const login = studentVueModule?.login || studentVueModule?.default?.login;

    if (typeof login !== "function") {
      return NextResponse.json(
        { error: "StudentVUE connector is not available right now." },
        { status: 500 }
      );
    }

    const basePortalUrl = `${parsedPortal.protocol}//${parsedPortal.host}/`;
    const portalCandidates = unique([parsedPortal.toString(), basePortalUrl]);
    const usernameCandidates = unique([
      username,
      username.includes("@") ? username.split("@")[0] : "",
    ]);
    const isParentGuess = /parent/i.test(parsedPortal.pathname);
    const modeCandidates = unique([isParentGuess, !isParentGuess]);

    let client = null;
    let loginErrors = [];

    for (const portalCandidate of portalCandidates) {
      for (const usernameCandidate of usernameCandidates) {
        for (const isParent of modeCandidates) {
          try {
            client = await login(portalCandidate, {
              username: usernameCandidate,
              password,
              isParent,
            });
            loginErrors = [];
            break;
          } catch (attemptError) {
            loginErrors.push(
              `${isParent ? "ParentVUE" : "StudentVUE"} + ${usernameCandidate}: ${
                attemptError?.message || "login rejected"
              }`
            );
          }
        }

        if (client) break;
      }

      if (client) break;
    }

    if (!client) {
      console.error("StudentVUE login failed for all attempts:", loginErrors.slice(0, 4));
      return NextResponse.json(
        {
          error:
            "StudentVUE login failed. Try username without @school-domain. If your district uses SSO-only login, use CSV fallback.",
          details: loginErrors.slice(0, 4),
        },
        { status: 401 }
      );
    }

    let gradebook;
    try {
      gradebook = await client.gradebook();
    } catch (error) {
      console.error("StudentVUE gradebook fetch failed:", error);
      return NextResponse.json(
        {
          error:
            "Connected to StudentVUE but gradebook could not be fetched for this account. Use CSV fallback if needed.",
        },
        { status: 422 }
      );
    }
    let courses = extractCoursesFromGradebook(gradebook);

    if (courses.length === 0) {
      const periods = Array.isArray(gradebook?.reportingPeriod?.available)
        ? gradebook.reportingPeriod.available
        : [];

      for (const period of periods) {
        if (!Number.isFinite(Number(period?.index))) {
          continue;
        }

        const candidate = await client.gradebook(Number(period.index));
        const extracted = extractCoursesFromGradebook(candidate);

        if (extracted.length > courses.length) {
          courses = extracted;
          gradebook = candidate;
        }
      }
    }

    if (courses.length === 0) {
      return NextResponse.json(
        {
          error:
            "Connected, but no grades were returned by district API for this account.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      courses,
      reportingPeriod: gradebook?.reportingPeriod?.current?.name || "",
      syncedAt: new Date().toISOString(),
      source: "studentvue-api",
    });
  } catch (error) {
    console.error("StudentVUE sync failed:", error);
    return NextResponse.json(
      { error: "Unable to sync StudentVUE grades right now." },
      { status: 500 }
    );
  }
}
