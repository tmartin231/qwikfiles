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
  parseJsonForMerge,
  prepareTextForDiff,
  type DiffFormat,
} from "@/lib/text-diff";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Copy, GitCompare } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export function FilesDiff() {
  const { t } = useTranslation();
  const [format, setFormat] = useState<DiffFormat>("json");
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diffOutput, setDiffOutput] = useState("");
  const [mergeOutput, setMergeOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleDiff = useCallback(() => {
    setError(null);
    setMergeOutput("");
    try {
      const a = prepareTextForDiff(left, format);
      const b = prepareTextForDiff(right, format);

      if (a.usedRawFallback || b.usedRawFallback) {
        setWarning(t("files.diffPage.fallbackWarning"));
      } else {
        setWarning(null);
      }

      const lines = diffLines(a.text, b.text);
      setDiffOutput(formatDiffText(lines));
      incrementFeatureUsage("files.diff");
    } catch {
      setError(t("files.diffPage.parseError"));
      setWarning(null);
    }
  }, [left, right, format, t]);

  const handleMerge = useCallback(() => {
    if (format !== "json") return;
    setError(null);
    setWarning(null);
    const result = parseJsonForMerge(left, right);
    if ("error" in result) {
      const key =
        result.error === "left"
          ? "files.diffPage.parseErrorLeft"
          : result.error === "right"
            ? "files.diffPage.parseErrorRight"
            : "files.diffPage.parseErrorBoth";
      setError(t(key));
      return;
    }
    try {
      const merged = deepMergeJson(result.left, result.right);
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
                onClick={() => {
                  setFormat(f);
                  setError(null);
                  setWarning(null);
                  setDiffOutput("");
                  setMergeOutput("");
                }}
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
                spellCheck={false}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("files.diffPage.rightLabel")}</Label>
              <textarea
                value={right}
                onChange={(e) => setRight(e.target.value)}
                rows={12}
                spellCheck={false}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>

          {warning && (
            <p className="text-sm text-amber-600 dark:text-amber-400" role="status">
              {warning}
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {diffOutput && (
            <div className="space-y-2">
              <Label>{t("files.diffPage.diffLabel")}</Label>
              <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
                {diffOutput}
              </pre>
            </div>
          )}

          {mergeOutput && (
            <div className="space-y-2">
              <Label>{t("files.diffPage.mergeLabel")}</Label>
              <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
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
            <Button
              variant="outline"
              onClick={handleMerge}
              disabled={!left.trim() || !right.trim()}
            >
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
