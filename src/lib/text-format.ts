import { XMLBuilder, XMLParser } from "fast-xml-parser";

export function formatJson(text: string, minify: boolean): string {
  const parsed = JSON.parse(text) as unknown;
  return JSON.stringify(parsed, null, minify ? 0 : 2);
}

export function formatXml(text: string, minify: boolean): string {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: !minify,
  });
  const data = parser.parse(text);
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: !minify,
    suppressEmptyNode: true,
  });
  return builder.build(data);
}
