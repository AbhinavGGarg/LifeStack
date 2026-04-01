import { XMLParser } from "fast-xml-parser";

const SOAP_ACTION = "http://edupoint.com/webservices/ProcessWebServiceRequest";

function normalizeText(value) {
  return String(value || "").trim();
}

function decodeHtmlEntities(value) {
  const input = String(value || "");

  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

function resolveServiceUrl(rawPortalUrl) {
  const normalized = normalizeText(rawPortalUrl);
  if (!normalized) {
    throw new Error("Portal URL is required.");
  }

  let parsed;
  try {
    parsed = new URL(
      /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`
    );
  } catch {
    throw new Error("Invalid portal URL.");
  }

  return `${parsed.origin}/Service/PXPCommunication.asmx`;
}

function buildGradebookEnvelope({ username, password, reportPeriod = "0" }) {
  const userID = normalizeText(username);
  const userPassword = normalizeText(password);
  const normalizedReportPeriod = /^\d+$/.test(String(reportPeriod || "").trim())
    ? String(reportPeriod).trim()
    : "0";

  const paramXml = `&lt;Parms&gt;&lt;ReportPeriod&gt;${normalizedReportPeriod}&lt;/ReportPeriod&gt;&lt;/Parms&gt;`;

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>${userID}</userID>
      <password>${userPassword}</password>
      <skipLoginLog>1</skipLoginLog>
      <parent>false</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>Gradebook</methodName>
      <paramStr>${paramXml}</paramStr>
    </ProcessWebServiceRequest>
  </soap:Body>
</soap:Envelope>`;
}

function findResultNode(node) {
  if (!node || typeof node !== "object") {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(node, "ProcessWebServiceRequestResult")) {
    return node.ProcessWebServiceRequestResult;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = findResultNode(item);
        if (nested !== null && nested !== undefined) {
          return nested;
        }
      }
      continue;
    }

    const nested = findResultNode(value);
    if (nested !== null && nested !== undefined) {
      return nested;
    }
  }

  return null;
}

function parsePercent(value) {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const matched = text.match(/-?\d+(\.\d+)?/);
  if (!matched) {
    return null;
  }

  const parsed = Number(matched[0]);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(parsed * 100) / 100));
}

function getMarkName(mark) {
  return normalizeText(
    mark?.["@_MarkName"] ||
      mark?.["@_Name"] ||
      mark?.["@_name"] ||
      mark?.MarkName ||
      mark?.Name
  );
}

function getMarkRank(mark) {
  const markName = getMarkName(mark);
  const lowered = markName.toLowerCase();
  const numericMatch = markName.match(/(\d{1,2})/);
  const numericPart = numericMatch ? Number(numericMatch[1]) : 0;
  const hasPercent = parsePercent(
    mark?.["@_CalculatedScoreRaw"] ||
      mark?.["@_CalculatedScoreString"] ||
      mark?.CalculatedScoreRaw ||
      mark?.CalculatedScoreString
  );

  let stageScore = 0;
  if (lowered.includes("current")) {
    stageScore = 6;
  } else if (lowered.includes("progress") || /\bp\d+\b/.test(lowered) || /^p\d+/.test(lowered)) {
    stageScore = 5;
  } else if (lowered.includes("quarter") || /\bq\d+\b/.test(lowered) || /^q\d+/.test(lowered)) {
    stageScore = 4;
  } else if (lowered.includes("semester") || /\bs\d+\b/.test(lowered) || /^s\d+/.test(lowered)) {
    stageScore = 3;
  } else if (lowered.includes("trimester") || lowered.includes("term") || /\bt\d+\b/.test(lowered)) {
    stageScore = 2;
  } else if (markName) {
    stageScore = 1;
  }

  return {
    stageScore,
    numericPart,
    hasNumericScore: hasPercent !== null ? 1 : 0,
  };
}

function pickBestMark(marks) {
  if (!marks.length) {
    return null;
  }

  const ranked = [...marks].sort((a, b) => {
    const aRank = getMarkRank(a);
    const bRank = getMarkRank(b);

    if (bRank.stageScore !== aRank.stageScore) {
      return bRank.stageScore - aRank.stageScore;
    }

    if (bRank.numericPart !== aRank.numericPart) {
      return bRank.numericPart - aRank.numericPart;
    }

    return bRank.hasNumericScore - aRank.hasNumericScore;
  });

  return ranked[0];
}

function toCourseRecord(courseLikeNode, index = 0) {
  const marks = toArray(courseLikeNode?.Mark || courseLikeNode?.Marks?.Mark);
  const bestMark = pickBestMark(marks);

  const courseName = normalizeText(
    courseLikeNode?.["@_Title"] ||
      courseLikeNode?.["@_ClassName"] ||
      courseLikeNode?.["@_CourseTitle"] ||
      courseLikeNode?.["@_Name"] ||
      courseLikeNode?.Title ||
      courseLikeNode?.ClassName ||
      courseLikeNode?.CourseTitle ||
      courseLikeNode?.Name
  );

  const teacher = normalizeText(
    courseLikeNode?.["@_Teacher"] ||
      courseLikeNode?.["@_TeacherName"] ||
      courseLikeNode?.["@_Staff"] ||
      courseLikeNode?.Teacher ||
      courseLikeNode?.TeacherName ||
      courseLikeNode?.Staff
  );

  const period = normalizeText(
    courseLikeNode?.["@_Period"] || courseLikeNode?.Period || courseLikeNode?.["@_ClassPeriod"]
  );
  const markLabel = getMarkName(bestMark);

  const letterGrade = normalizeText(
    bestMark?.["@_CalculatedScoreString"] ||
      bestMark?.["@_Grade"] ||
      bestMark?.CalculatedScoreString ||
      bestMark?.Grade ||
      courseLikeNode?.["@_Grade"] ||
      courseLikeNode?.Grade
  );

  const percentSource =
    bestMark?.["@_CalculatedScoreRaw"] ||
    bestMark?.CalculatedScoreRaw ||
    bestMark?.["@_CalculatedScoreString"] ||
    bestMark?.CalculatedScoreString ||
    courseLikeNode?.["@_Percent"] ||
    courseLikeNode?.Percent ||
    courseLikeNode?.["@_CalculatedScoreRaw"];
  const percent = parsePercent(percentSource);

  if (!courseName || (!letterGrade && percent === null)) {
    return null;
  }

  return {
    id: `${courseName}-${period || index}`,
    name: courseName,
    period: period || null,
    teacher: teacher || null,
    markLabel: markLabel || null,
    letterGrade: letterGrade || null,
    percent,
  };
}

function collectCourseNodes(node, collector = []) {
  if (!node || typeof node !== "object") {
    return collector;
  }

  if (node.Course) {
    toArray(node.Course).forEach((item) => collector.push(item));
  }

  if (node.Classes?.Class) {
    toArray(node.Classes.Class).forEach((item) => collector.push(item));
  }

  if (node.Class) {
    toArray(node.Class).forEach((item) => collector.push(item));
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectCourseNodes(item, collector));
    } else if (value && typeof value === "object") {
      collectCourseNodes(value, collector);
    }
  }

  return collector;
}

function parseGradebookXml(rawXml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    trimValues: true,
  });

  const parsed = parser.parse(rawXml);
  const courseNodes = collectCourseNodes(parsed, []);
  const dedupe = new Map();

  courseNodes.forEach((node, index) => {
    const record = toCourseRecord(node, index);
    if (!record) {
      return;
    }

    const key = `${record.name.toLowerCase()}|${record.period || ""}`;
    if (!dedupe.has(key)) {
      dedupe.set(key, record);
    }
  });

  const courses = Array.from(dedupe.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const numericCourses = courses.filter((course) => Number.isFinite(course.percent));
  const averagePercent =
    numericCourses.length > 0
      ? Math.round(
          (numericCourses.reduce((sum, course) => sum + Number(course.percent), 0) /
            numericCourses.length) *
            100
        ) / 100
      : null;

  return {
    courses,
    summary: {
      courseCount: courses.length,
      numericCourseCount: numericCourses.length,
      averagePercent,
    },
  };
}

export async function fetchStudentVueGrades({
  portalUrl,
  username,
  password,
  reportPeriod = "0",
}) {
  const resolvedServiceUrl = resolveServiceUrl(portalUrl);
  const user = normalizeText(username);
  const pass = normalizeText(password);

  if (!user || !pass) {
    throw new Error("Username and password are required.");
  }

  const envelope = buildGradebookEnvelope({
    username: user,
    password: pass,
    reportPeriod,
  });

  const response = await fetch(resolvedServiceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: SOAP_ACTION,
    },
    body: envelope,
    cache: "no-store",
  });

  const soapText = await response.text();

  if (!response.ok) {
    throw new Error("Portal request failed. Check district URL and try again.");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    trimValues: true,
  });
  const parsedSoap = parser.parse(soapText);
  const encodedResult = findResultNode(parsedSoap);

  if (typeof encodedResult !== "string") {
    throw new Error("Unable to parse portal response.");
  }

  const decoded = decodeHtmlEntities(encodedResult);
  const lowered = decoded.toLowerCase();
  if (lowered.includes("invalid user id or password") || lowered.includes("access denied")) {
    throw new Error("Invalid StudentVUE username or password.");
  }

  const parsed = parseGradebookXml(decoded);

  if (!parsed.courses.length) {
    throw new Error(
      "Connected, but no classes were returned. Try StudentVUE (not ParentVUE) and verify your portal URL."
    );
  }

  return {
    serviceUrl: resolvedServiceUrl,
    reportPeriod:
      /^\d+$/.test(String(reportPeriod || "").trim()) ? String(reportPeriod).trim() : "0",
    syncedAt: new Date().toISOString(),
    ...parsed,
  };
}
