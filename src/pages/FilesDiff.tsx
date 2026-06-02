import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  deepMergeJson,
  diffLines,
  formatDiffText,
} from "@/lib/text-diff";
import YAML from "yaml";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Copy, GitCompare } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

type DiffFormat = "json" | "yaml";

function normalize(text: string, format: DiffFormat): string {
  if (format === "yaml") {
    const parsed = YAML.parse(text);
    return YAML.stringify(parsed);
  }
  return JSON.stringify(JSON.parse(text), null, 2);
}

export function FilesDiff() {
  const { t } = useTranslation();
  const [format, setFormat] = useState<DiffFormat>("json");
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diffOutput, setDiffOutput] = useState("");
  const [mergeOutput, setMergeOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDiff = useCallback(() => {
    setError(null);
    setMergeOutput("");
    try {
      const a = normalize(left, format);
      const b = normalize(right, format);
      const lines = diffLines(a, b);
      setDiffOutput(formatDiffText(lines));
      incrementFeatureUsage("files.diff");
    } catch {
      setError(t("files.diffPage.parseError"));
    }
  }, [left, right, format, t]);

  const handleMerge = useCallback(() => {
    if (format !== "json") return;
    setError(null);
    try {
      const a = JSON.parse(left) as unknown;
      const b = JSON.parse(right) as unknown;
      const merged = deepMergeJson(a, b);
      setMergeOutput(JSON.stringify(merged, null, 2));
      incrementFeatureUsage("files.diff");
    } catch {
      setError(t("files.diffPage.parseError"));
    }
  }, [left, right, format, t]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-4 py-8">
      <BackLink to="/files" />
      <div className="mb-6 flex items-center gap-3">
        <GitCompare className="h-8 w-8 text-violet-500" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold">{t("files.tools.diff.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("files.tools.diff.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("files.diffPage.title")}</CardTitle>
          <CardDescription>{t("files.diffPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex gap-2">
            {(["json", "yaml"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={format === f ? "default" : "outline"}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("files.diffPage.leftLabel")}</Label>
              <textarea
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("files.diffPage.rightLabel")}</Label>
              <textarea
                value={right}
                onChange={(e) => setRight(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {diffOutput && (
            <div className="space-y-2">
              <Label>{t("files.diffPage.diffLabel")}</Label>
              <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
                {diffOutput}
              </pre>
            </div>
          )}

          {mergeOutput && (
            <div className="space-y-2">
              <Label>{t("files.diffPage.mergeLabel")}</Label>
              <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
                {mergeOutput}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={handleDiff} disabled={!left.trim() || !right.trim()}>
            {t("files.diffPage.diffBtn")}
          </Button>
          {format === "json" && (
            <Button variant="outline" onClick={handleMerge} disabled={!left.trim() || !right.trim()}>
              {t("files.diffPage.mergeBtn")}
            </Button>
          )}
          {diffOutput && (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => void navigator.clipboard.writeText(diffOutput)}
            >
              <Copy className="h-4 w-4" aria-hidden />
              {t("files.base64Page.copyBtn")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
