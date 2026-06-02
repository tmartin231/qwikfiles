import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { baseName } from "@/lib/image-utils";
import { formatJson, formatXml } from "@/lib/text-format";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, Wand2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type FormatType = "json" | "xml";

export function FilesFormat() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [formatType, setFormatType] = useState<FormatType>("json");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const runFormat = useCallback(
    async (minify: boolean) => {
      if (!file) return;
      setError(null);
      setProcessing(true);
      try {
        const text = await file.text();
        const formatted =
          formatType === "json"
            ? formatJson(text, minify)
            : formatXml(text, minify);
        const blob = new Blob([formatted], { type: "text/plain;charset=utf-8" });
        if (result?.url) URL.revokeObjectURL(result.url);
        setResult({ blob, url: URL.createObjectURL(blob) });
        incrementFeatureUsage("files.format");
      } catch {
        setError(t("files.formatPage.parseError"));
      } finally {
        setProcessing(false);
      }
    },
    [file, formatType, result?.url, t],
  );

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result?.url]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/files" />
      <div className="mb-6 flex items-center gap-3">
        <Wand2 className="h-8 w-8 text-emerald-500" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold">{t("files.tools.format.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("files.tools.format.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("files.formatPage.title")}</CardTitle>
          <CardDescription>{t("files.formatPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex gap-2">
            {(["json", "xml"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={formatType === f ? "default" : "outline"}
                onClick={() => setFormatType(f)}
              >
                {f.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>{t("files.page.fileLabel")}</Label>
            <FileDropzone
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              accept={
                formatType === "json"
                  ? { "application/json": [".json"] }
                  : { "application/xml": [".xml"], "text/xml": [".xml"] }
              }
              hint={t("files.formatPage.dropzoneHint")}
              activeHint={t("files.page.dropzoneActive")}
              removeLabel={t("images.removeFile")}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => runFormat(false)} disabled={!file || processing}>
            {t("files.formatPage.prettifyBtn")}
          </Button>
          <Button
            variant="outline"
            onClick={() => runFormat(true)}
            disabled={!file || processing}
          >
            {t("files.formatPage.minifyBtn")}
          </Button>
        </CardFooter>
      </Card>

      {result && file && (
        <div className="mt-6">
          <a
            href={result.url}
            download={`${baseName(file.name)}-formatted.${formatType}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("files.page.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
