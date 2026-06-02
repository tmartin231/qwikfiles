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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { baseName } from "@/lib/image-utils";
import { degrees, PDFDocument } from "pdf-lib";
import { Download, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { incrementFeatureUsage } from "@/lib/usage-tracking";

type RotationDegrees = 90 | 180 | 270;

async function rotatePdf(
  buffer: ArrayBuffer,
  rotation: RotationDegrees,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer);
  for (const page of pdfDoc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotation) % 360));
  }
  return pdfDoc.save();
}

const ROTATIONS: RotationDegrees[] = [90, 180, 270];

export function PdfRotate() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<RotationDegrees>(90);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState("rotated.pdf");

  const handleRotate = useCallback(async () => {
    if (!file) return;
    setError(null);
    setRotating(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await rotatePdf(buffer, rotation);
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(`${baseName(file.name)}-rotated.pdf`);
      incrementFeatureUsage("pdf.rotate");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("pdf.rotatePage.genericError"),
      );
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    } finally {
      setRotating(false);
    }
  }, [file, rotation, resultUrl, t]);

  const handleReset = useCallback(() => {
    setFile(null);
    setError(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setRotation(90);
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
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <RotateCw className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("pdf.tools.rotate.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pdf.tools.rotate.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pdf.rotatePage.title")}</CardTitle>
          <CardDescription>{t("pdf.rotatePage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{t("pdf.rotatePage.fileLabel")}</Label>
            <FileDropzone
              accept={{ "application/pdf": [".pdf"] }}
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              hint={t("pdf.rotatePage.dropzoneHint")}
              activeHint={t("pdf.rotatePage.dropzoneActive")}
              removeLabel={t("images.removeFile")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("pdf.rotatePage.rotationLabel")}</Label>
            <Select
              value={String(rotation)}
              onValueChange={(v) => setRotation(Number(v) as RotationDegrees)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROTATIONS.map((deg) => (
                  <SelectItem key={deg} value={String(deg)}>
                    {t(`pdf.rotatePage.rotations.${deg}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("pdf.rotatePage.rotationHint")}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={handleRotate}
            disabled={!file || rotating}
            className="min-w-28"
          >
            {rotating ? "…" : t("pdf.rotatePage.rotateBtn")}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!file && !resultUrl}
          >
            {t("pdf.rotatePage.resetBtn")}
          </Button>
        </CardFooter>
      </Card>

      {resultUrl && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("pdf.rotatePage.resultReady")}
          </p>
          <a
            href={resultUrl}
            download={resultFilename}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("pdf.rotatePage.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
