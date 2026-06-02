import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BackLink } from "@/components/BackLink";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { generateFaviconIco } from "@/lib/favicon";
import { baseName } from "@/lib/image-utils";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ImageFavicon() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const blob = await generateFaviconIco(file);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      incrementFeatureUsage("images.favicon");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("images.faviconPage.genericError"),
      );
    } finally {
      setProcessing(false);
    }
  }, [file, resultUrl, t]);

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/images" />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
          <Sparkles className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("images.tools.favicon.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("images.tools.favicon.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <p className="text-sm text-muted-foreground">
            {t("images.faviconPage.hint")}
          </p>
          <div className="space-y-2">
            <Label>{t("images.imageLabel")}</Label>
            <FileDropzone
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
              }}
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              hint={t("images.faviconPage.dropzoneHint")}
              activeHint={t("images.dropzoneActive")}
              removeLabel={t("images.removeFile")}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={!file || processing}>
            {processing ? "…" : t("images.faviconPage.generateBtn")}
          </Button>
        </CardFooter>
      </Card>

      {resultUrl && file && (
        <div className="mt-6 flex flex-col gap-3">
          <img
            src={resultUrl}
            alt=""
            className="h-16 w-16 rounded border bg-muted object-contain"
          />
          <a
            href={resultUrl}
            download={`${baseName(file.name)}.ico`}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("images.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
