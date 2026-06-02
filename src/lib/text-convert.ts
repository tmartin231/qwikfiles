import YAML from "yaml";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

export type TextFormat = "json" | "csv" | "tsv" | "md" | "yaml" | "xml" | "txt";

export const TARGET_FORMATS: { value: TextFormat; labelKey: string; ext: string }[] = [
  { value: "json", labelKey: "files.page.formats.json", ext: "json" },
  { value: "csv", labelKey: "files.page.formats.csv", ext: "csv" },
  { value: "tsv", labelKey: "files.page.formats.tsv", ext: "tsv" },
  { value: "md", labelKey: "files.page.formats.md", ext: "md" },
  { value: "yaml", labelKey: "files.page.formats.yaml", ext: "yaml" },
  { value: "xml", labelKey: "files.page.formats.xml", ext: "xml" },
  { value: "txt", labelKey: "files.page.formats.txt", ext: "txt" },
];

export function detectFormat(file: File, text: string): TextFormat | "txt" {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".log")) return "txt";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".tsv")) return "tsv";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".yml") || name.endsWith(".yaml")) return "yaml";
  if (name.endsWith(".xml")) return "xml";
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) || typeof parsed === "object") return "json";
  } catch {
    // ignore
  }
  const trimmed = text.trimStart();
  if (trimmed.startsWith("---") || trimmed.includes(":\n")) return "yaml";
  if (trimmed.startsWith("<") && trimmed.includes(">")) return "xml";
  if (text.includes("\t") && text.includes("\n")) return "tsv";
  return "txt";
}

function parseDelimited(
  text: string,
  delimiter: "," | "\t",
): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (line: string) => line.split(delimiter).map((s) => s.trim());
  const headers = split(lines[0]!);
  const rows = lines.slice(1).map((l) => {
    const cols = split(l);
    while (cols.length < headers.length) cols.push("");
    return cols;
  });
  return { headers, rows };
}

function delimitedToJson(text: string, delimiter: "," | "\t"): unknown[] {
  const { headers, rows } = parseDelimited(text, delimiter);
  if (headers.length === 0) return [];
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

function jsonToDelimited(data: unknown, delimiter: "," | "\t"): string {
  if (!Array.isArray(data)) return "";
  if (data.length === 0) return "";
  const objects = data as Record<string, unknown>[];
  const headerSet = new Set<string>();
  for (const obj of objects) {
    Object.keys(obj ?? {}).forEach((k) => headerSet.add(k));
  }
  const headers = Array.from(headerSet);
  const sep = delimiter;
  const escape = (value: unknown) => {
    const s =
      value === null || value === undefined
        ? ""
        : typeof value === "string"
          ? value
          : JSON.stringify(value);
    if (s.includes(sep) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const headerLine = headers.join(sep);
  const lines = objects.map((obj) =>
    headers.map((h) => escape(obj?.[h])).join(sep),
  );
  return [headerLine, ...lines].join("\n");
}

function jsonToMarkdownTable(data: unknown): string {
  if (!Array.isArray(data) || data.length === 0) return "";
  const objects = data as Record<string, unknown>[];
  const headerSet = new Set<string>();
  for (const obj of objects) {
    Object.keys(obj ?? {}).forEach((k) => headerSet.add(k));
  }
  const headers = Array.from(headerSet);
  const headerRow = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const rows = objects.map(
    (obj) =>
      `| ${headers
        .map((h) => {
          const v = obj?.[h];
          if (v === null || v === undefined) return "";
          if (typeof v === "string") return v.replace(/\n/g, " ");
          return JSON.stringify(v);
        })
        .join(" | ")} |`,
  );
  return [headerRow, separator, ...rows].join("\n");
}

function parseJsonSafe(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseYamlSafe(text: string): unknown | null {
  try {
    return YAML.parse(text);
  } catch {
    return null;
  }
}

function parseXmlSafe(text: string): unknown | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    return parser.parse(text);
  } catch {
    return null;
  }
}

function jsonToYaml(data: unknown): string {
  return YAML.stringify(data);
}

function jsonToXml(data: unknown): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: true,
  });
  return builder.build(data);
}

export function convertText(
  input: string,
  from: TextFormat | "txt",
  to: TextFormat,
): string | null {
  if (from === to) return input;

  if (from === "md" && to === "txt") return input;
  if (from === "txt" && to === "md") return input;
  if (from === "txt" && to === "txt") return input;
  if (from === "md") return null;

  let jsonValue: unknown | null = null;

  if (from === "json") {
    jsonValue = parseJsonSafe(input);
  } else if (from === "csv") {
    jsonValue = delimitedToJson(input, ",");
  } else if (from === "tsv") {
    jsonValue = delimitedToJson(input, "\t");
  } else if (from === "yaml") {
    jsonValue = parseYamlSafe(input);
  } else if (from === "xml") {
    jsonValue = parseXmlSafe(input);
  } else if (from === "txt") {
    const parsed = parseJsonSafe(input);
    jsonValue = parsed !== null ? parsed : input;
  }

  if (jsonValue === null) return null;

  if (to === "txt") {
    if (typeof jsonValue === "string") return jsonValue;
    return JSON.stringify(jsonValue, null, 2);
  }
  if (to === "json") return JSON.stringify(jsonValue, null, 2);
  if (to === "csv") return jsonToDelimited(jsonValue, ",");
  if (to === "tsv") return jsonToDelimited(jsonValue, "\t");
  if (to === "md") return jsonToMarkdownTable(jsonValue);
  if (to === "yaml") return jsonToYaml(jsonValue);
  if (to === "xml") return jsonToXml(jsonValue);

  return null;
}
