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
import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { Download, Shrink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

if (typeof pdfjsWorker === "string") {
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
} else {
  GlobalWorkerOptions.workerSrc = (pdfjsWorker as URL).toString();
}

async function compressPdf(
  buffer: ArrayBuffer,
  quality: number,
  scale: number,
): Promise<Uint8Array> {
  const pdf = await getDocument({ data: buffer }).promise;
  const outDoc = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!jpegBlob) continue;
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embedded = await outDoc.embedJpg(jpegBytes);
    const { width, height } = embedded.scale(1);
    const newPage = outDoc.addPage([width, height]);
    newPage.drawImage(embedded, { x: 0, y: 0, width, height });
  }

  return outDoc.save();
}

export function PdfCompress() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(72);
  const [scale, setScale] = useState(1.25);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState("compressed.pdf");

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const buffer = await file.arrayBuffer();
      const q = Math.max(0.3, Math.min(0.95, quality / 100));
      const bytes = await compressPdf(buffer, q, scale);
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(`${baseName(file.name)}-compressed.pdf`);
      incrementFeatureUsage("pdf.compress");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("pdf.compressPage.genericError"),
      );
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    } finally {
      setCompressing(false);
    }
  }, [file, quality, scale, resultUrl, t]);

  const handleReset = useCallback(() => {
    setFile(null);
    setError(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setQuality(72);
    setScale(1.25);
  }, [resultUrl]);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/pdf" />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Shrink className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("pdf.tools.compress.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pdf.tools.compress.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pdf.compressPage.title")}</CardTitle>
          <CardDescription>{t("pdf.compressPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{t("pdf.compressPage.fileLabel")}</Label>
            <FileDropzone
              accept={{ "application/pdf": [".pdf"] }}
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              hint={t("pdf.compressPage.dropzoneHint")}
              activeHint={t("pdf.compressPage.dropzoneActive")}
              removeLabel={t("images.removeFile")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-quality">
              {t("pdf.compressPage.qualityLabel")}: {quality}%
            </Label>
            <input
              id="pdf-quality"
              type="range"
              min={40}
              max={90}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t("pdf.compressPage.qualityHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-scale">
              {t("pdf.compressPage.scaleLabel")}: {scale.toFixed(2)}×
            </Label>
            <input
              id="pdf-scale"
              type="range"
              min={1}
              max={2}
              step={0.25}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={handleCompress}
            disabled={!file || compressing}
            className="min-w-28"
          >
            {compressing ? "…" : t("pdf.compressPage.compressBtn")}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!file && !resultUrl}
          >
            {t("pdf.compressPage.resetBtn")}
          </Button>
        </CardFooter>
      </Card>

      {resultUrl && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("pdf.compressPage.resultReady")}
          </p>
          <a
            href={resultUrl}
            download={resultFilename}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("pdf.compressPage.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
