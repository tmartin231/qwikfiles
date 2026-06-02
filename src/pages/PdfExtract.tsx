"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BackLink } from "@/components/BackLink";
import { baseName } from "@/lib/image-utils";
import { extractPdfPages, getPdfPageCount } from "@/lib/pdf-utils";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, FileOutput } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function PdfExtract() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPageCount(0);
      return;
    }
    let cancelled = false;
    void file.arrayBuffer().then((buffer) => {
      if (cancelled) return;
      getPdfPageCount(buffer)
        .then((count) => {
          if (cancelled) return;
          setPageCount(count);
          setStartPage(1);
          setEndPage(count);
        })
        .catch(() => {
          if (!cancelled) setError(t("pdf.extractPage.loadError"));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [file, t]);

  const handleExtract = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await extractPdfPages(buffer, startPage, endPage);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      setResultUrl(URL.createObjectURL(blob));
      incrementFeatureUsage("pdf.extract");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("pdf.extractPage.genericError"),
      );
    } finally {
      setProcessing(false);
    }
  }, [file, startPage, endPage, resultUrl, t]);

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/pdf" />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
          <FileOutput className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("pdf.tools.extract.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("pdf.tools.extract.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pdf.extractPage.title")}</CardTitle>
          <CardDescription>{t("pdf.extractPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{t("pdf.extractPage.fileLabel")}</Label>
            <FileDropzone
              accept={{ "application/pdf": [".pdf"] }}
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              hint={t("pdf.extractPage.dropzoneHint")}
              activeHint={t("pdf.extractPage.dropzoneActive")}
              removeLabel={t("images.removeFile")}
            />
          </div>

          {pageCount > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-page">{t("pdf.extractPage.fromPage")}</Label>
                <input
                  id="start-page"
                  type="number"
                  min={1}
                  max={pageCount}
                  value={startPage}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStartPage(v);
                    if (v > endPage) setEndPage(v);
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-page">{t("pdf.extractPage.toPage")}</Label>
                <input
                  id="end-page"
                  type="number"
                  min={startPage}
                  max={pageCount}
                  value={endPage}
                  onChange={(e) => setEndPage(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                {t("pdf.extractPage.pageCount", { count: pageCount })}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleExtract}
            disabled={!file || pageCount === 0 || processing}
          >
            {processing ? "…" : t("pdf.extractPage.extractBtn")}
          </Button>
        </CardFooter>
      </Card>

      {resultUrl && file && (
        <div className="mt-6">
          <a
            href={resultUrl}
            download={`${baseName(file.name)}-pages-${startPage}-${endPage}.pdf`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("pdf.extractPage.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
