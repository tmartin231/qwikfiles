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
import { unlockPdf } from "@/lib/pdf-utils";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, LockOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function PdfUnlock() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleUnlock = useCallback(async () => {
    if (!file || !password) return;
    setError(null);
    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await unlockPdf(buffer, password);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      setResultUrl(URL.createObjectURL(blob));
      incrementFeatureUsage("pdf.unlock");
    } catch {
      setError(t("pdf.unlockPage.wrongPassword"));
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    } finally {
      setProcessing(false);
    }
  }, [file, password, resultUrl, t]);

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/pdf" />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          <LockOpen className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("pdf.tools.unlock.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("pdf.tools.unlock.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pdf.unlockPage.title")}</CardTitle>
          <CardDescription>{t("pdf.unlockPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{t("pdf.unlockPage.fileLabel")}</Label>
            <FileDropzone
              accept={{ "application/pdf": [".pdf"] }}
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              hint={t("pdf.unlockPage.dropzoneHint")}
              activeHint={t("pdf.unlockPage.dropzoneActive")}
              removeLabel={t("images.removeFile")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf-password">{t("pdf.unlockPage.passwordLabel")}</Label>
            <input
              id="pdf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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
            onClick={handleUnlock}
            disabled={!file || !password || processing}
          >
            {processing ? "…" : t("pdf.unlockPage.unlockBtn")}
          </Button>
        </CardFooter>
      </Card>

      {resultUrl && file && (
        <div className="mt-6">
          <a
            href={resultUrl}
            download={`${baseName(file.name)}-unlocked.pdf`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("pdf.unlockPage.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
