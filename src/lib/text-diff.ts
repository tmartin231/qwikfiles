import JSON5 from "json5";
import YAML from "yaml";

export type DiffLine = {
  type: "same" | "add" | "remove";
  text: string;
};

export type DiffFormat = "json" | "yaml";

export type PrepareDiffResult = {
  text: string;
  /** true = Parse fehlgeschlagen, Roh-Text wird verglichen */
  usedRawFallback: boolean;
};

/** JSON.parse, bei Fehler JSON5 (Kommentare, trailing commas, …). */
export function parseJsonLenient(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new SyntaxError("empty");
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return JSON5.parse(trimmed) as unknown;
  }
}

export function prepareTextForDiff(
  text: string,
  format: DiffFormat,
): PrepareDiffResult {
  const trimmed = text.trim();
  if (!trimmed) return { text: "", usedRawFallback: false };

  if (format === "yaml") {
    try {
      const parsed = YAML.parse(trimmed);
      return {
        text: YAML.stringify(parsed),
        usedRawFallback: false,
      };
    } catch {
      return { text: trimmed, usedRawFallback: true };
    }
  }

  try {
    const parsed = parseJsonLenient(trimmed);
    return {
      text: JSON.stringify(parsed, null, 2),
      usedRawFallback: false,
    };
  } catch {
    return { text: trimmed, usedRawFallback: true };
  }
}

/** Einfacher zeilenbasierter Diff (LCS). */
export function diffLines(a: string, b: string): DiffLine[] {
  const linesA = a.split(/\r?\n/);
  const linesB = b.split(/\r?\n/);
  const n = linesA.length;
  const m = linesB.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        linesA[i] === linesB[j]
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (linesA[i] === linesB[j]) {
      result.push({ type: "same", text: linesA[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      result.push({ type: "remove", text: linesA[i]! });
      i++;
    } else {
      result.push({ type: "add", text: linesB[j]! });
      j++;
    }
  }
  while (i < n) {
    result.push({ type: "remove", text: linesA[i]! });
    i++;
  }
  while (j < m) {
    result.push({ type: "add", text: linesB[j]! });
    j++;
  }
  return result;
}

export function formatDiffText(lines: DiffLine[]): string {
  return lines
    .map((l) => {
      if (l.type === "same") return `  ${l.text}`;
      if (l.type === "add") return `+ ${l.text}`;
      return `- ${l.text}`;
    })
    .join("\n");
}

export function deepMergeJson(a: unknown, b: unknown): unknown {
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [key, val] of Object.entries(b as Record<string, unknown>)) {
      out[key] = key in out ? deepMergeJson(out[key], val) : val;
    }
    return out;
  }
  return b;
}

export type ParseJsonSideError = "left" | "right" | "both";

export function parseJsonForMerge(
  left: string,
  right: string,
): { left: unknown; right: unknown } | { error: ParseJsonSideError } {
  let parsedLeft: unknown;
  let parsedRight: unknown;
  let leftOk = true;
  let rightOk = true;

  try {
    parsedLeft = parseJsonLenient(left);
  } catch {
    leftOk = false;
  }

  try {
    parsedRight = parseJsonLenient(right);
  } catch {
    rightOk = false;
  }

  if (!leftOk && !rightOk) return { error: "both" };
  if (!leftOk) return { error: "left" };
  if (!rightOk) return { error: "right" };
  return { left: parsedLeft!, right: parsedRight! };
}
