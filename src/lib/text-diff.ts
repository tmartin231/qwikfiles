export type DiffLine = {
  type: "same" | "add" | "remove";
  text: string;
};

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
      out[key] =
        key in out ? deepMergeJson(out[key], val) : val;
    }
    return out;
  }
  return b;
}
