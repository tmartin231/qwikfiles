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
import {
  convertText,
  detectFormat,
  TARGET_FORMATS,
  type TextFormat,
} from "@/lib/text-convert";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, FileArchive } from "lucide-react";
import JSZip from "jszip";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function FilesConvert() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<TextFormat>("json");
  const [results, setResults] = useState<
    { blob: Blob; baseName: string; ext: string }[]
  >([]);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const handleFileChange = useCallback((v: File | File[] | null) => {
    if (v === null) setFiles([]);
    else setFiles(Array.isArray(v) ? v : [v]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    setError(null);
    setConverting(true);
    try {
      const nextResults: { blob: Blob; baseName: string; ext: string }[] = [];
      for (const file of files) {
        const text = await file.text();
        const from = detectFormat(file, text);
        const converted = convertText(text, from, targetFormat);
        if (converted === null) throw new Error("UNSUPPORTED_COMBINATION");
        const ext =
          TARGET_FORMATS.find((f) => f.value === targetFormat)?.ext ??
          targetFormat;
        nextResults.push({
          blob: new Blob([converted], { type: "text/plain;charset=utf-8" }),
          baseName: baseName(file.name),
          ext,
        });
      }
      setResults(nextResults);
      incrementFeatureUsage("files.convert");
    } catch (e) {
      if (e instanceof Error && e.message === "UNSUPPORTED_COMBINATION") {
        setError(t("files.page.unsupportedCombination"));
      } else {
        setError(e instanceof Error ? e.message : t("files.page.genericError"));
      }
      setResults([]);
    } finally {
      setConverting(false);
    }
  }, [files, targetFormat, t]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResults([]);
    setResultUrls([]);
    setError(null);
    setTargetFormat("json");
  }, []);

  useEffect(() => {
    if (!results.length) {
      setResultUrls([]);
      return;
    }
    const urls = results.map((r) => URL.createObjectURL(r.blob));
    setResultUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [results]);

  const handleDownloadZip = useCallback(async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach(({ blob, baseName: name, ext }, i) => {
      zip.file(
        results.length > 1 ? `${name}_${i + 1}.${ext}` : `${name}.${ext}`,
        blob,
      );
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-files.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/files" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("files.tools.convert.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("files.tools.convert.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("files.page.title")}</CardTitle>
          <CardDescription>{t("files.page.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{t("files.page.fileLabel")}</Label>
            <FileDropzone
              multiple
              value={files}
              addMoreLabel={t("images.addMoreFiles")}
              onFileChange={handleFileChange}
              accept={{
                "application/json": [".json"],
                "text/plain": [".txt", ".log"],
                "text/markdown": [".md", ".markdown"],
                "text/csv": [".csv"],
                "text/tab-separated-values": [".tsv"],
                "application/x-yaml": [".yaml", ".yml"],
                "text/yaml": [".yaml", ".yml"],
                "application/xml": [".xml"],
                "text/xml": [".xml"],
              }}
              hint={t("files.page.dropzoneHint")}
              activeHint={t("files.page.dropzoneActive")}
              removeLabel={t("images.removeFile")}
              fileCountLabel={(count) => t("images.filesSelected", { count })}
              multipleHint={t("images.multipleHint")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-format">{t("files.page.targetFormat")}</Label>
            <select
              id="target-format"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as TextFormat)}
              className="h-9 w-40 cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {TARGET_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {t(f.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleConvert}
            disabled={files.length === 0 || converting}
            className="min-w-28"
          >
            {converting ? "…" : t("files.page.convertBtn")}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={files.length === 0 && results.length === 0}
          >
            {t("files.page.resetBtn")}
          </Button>
        </CardFooter>
      </Card>

      {results.length > 0 && resultUrls.length === results.length && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("files.page.resultsReady", { count: results.length })}
          </p>
          {results.length === 1 ? (
            <a
              href={resultUrls[0]}
              download={`${results[0].baseName}.${results[0].ext}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("files.page.downloadResult")}
            </a>
          ) : (
            <Button type="button" className="gap-2" onClick={handleDownloadZip}>
              <FileArchive className="h-4 w-4" aria-hidden />
              {t("files.page.downloadZip")}
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
