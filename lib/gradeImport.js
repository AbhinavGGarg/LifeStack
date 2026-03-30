function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseNumericGrade(raw) {
  const value = String(raw || "").trim();

  if (!value) {
    return null;
  }

  const number = Number(value.replace(/[^0-9.]+/g, ""));
  if (Number.isFinite(number)) {
    return Math.max(0, Math.min(100, number));
  }

  const letter = value.toUpperCase();
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

function findHeaderIndex(headers, candidates) {
  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

export function parseCoursesFromCsv(csvText) {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headerRow = splitCsvLine(lines[0]).map(normalizeHeader);

  const nameIndex = findHeaderIndex(headerRow, [
    "course",
    "class",
    "subject",
    "period",
  ]);

  const gradeIndex = findHeaderIndex(headerRow, [
    "grade",
    "percent",
    "score",
    "mark",
    "current",
  ]);

  const targetIndex = findHeaderIndex(headerRow, ["target", "goal"]);

  if (nameIndex === -1 || gradeIndex === -1) {
    return [];
  }

  const parsed = lines
    .slice(1)
    .map((line) => splitCsvLine(line))
    .map((cells) => {
      const name = String(cells[nameIndex] || "").trim();
      const grade = parseNumericGrade(cells[gradeIndex]);
      const targetRaw = targetIndex >= 0 ? parseNumericGrade(cells[targetIndex]) : null;

      if (!name || grade === null) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        name,
        grade,
        target: targetRaw === null ? 90 : targetRaw,
      };
    })
    .filter(Boolean);

  const deduped = [];
  const seen = new Set();

  parsed.forEach((course) => {
    const key = course.name.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    deduped.push(course);
  });

  return deduped;
}
