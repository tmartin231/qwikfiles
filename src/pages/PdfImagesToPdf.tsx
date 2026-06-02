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
import { createMultiPagePdfFromImages } from "@/lib/pdf-from-images";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, Images } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function PdfImagesToPdf() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (files.length === 0) return;
    setError(null);
    setProcessing(true);
    try {
      const bytes = await createMultiPagePdfFromImages(files);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      setResultUrl(URL.createObjectURL(blob));
      incrementFeatureUsage("pdf.imagesToPdf");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("pdf.imagesToPdfPage.genericError"),
      );
    } finally {
      setProcessing(false);
    }
  }, [files, resultUrl, t]);

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/pdf" />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
          <Images className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("pdf.tools.imagesToPdf.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("pdf.tools.imagesToPdf.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pdf.imagesToPdfPage.title")}</CardTitle>
          <CardDescription>{t("pdf.imagesToPdfPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{t("pdf.imagesToPdfPage.fileLabel")}</Label>
            <FileDropzone
              multiple
              value={files}
              onFileChange={(v) =>
                setFiles(v === null ? [] : Array.isArray(v) ? v : [v])
              }
              addMoreLabel={t("images.addMoreFiles")}
              hint={t("pdf.imagesToPdfPage.dropzoneHint")}
              activeHint={t("pdf.imagesToPdfPage.dropzoneActive")}
              removeLabel={t("images.removeFile")}
              fileCountLabel={(count) => t("images.filesSelected", { count })}
              multipleHint={t("images.multipleHint")}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreate}
            disabled={files.length === 0 || processing}
          >
            {processing ? "…" : t("pdf.imagesToPdfPage.createBtn")}
          </Button>
        </CardFooter>
      </Card>

      {resultUrl && (
        <div className="mt-6">
          <a
            href={resultUrl}
            download="images.pdf"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("pdf.imagesToPdfPage.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
