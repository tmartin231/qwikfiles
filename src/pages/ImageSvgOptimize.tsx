import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BackLink } from "@/components/BackLink";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { baseName } from "@/lib/image-utils";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Download, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { optimize } from "svgo/browser";

export function ImageSvgOptimize() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    savings: number;
  } | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const input = await file.text();
      const output = optimize(input, {
        multipass: true,
        plugins: ["preset-default"],
      });
      if (!output.data) throw new Error("Optimization failed");
      const blob = new Blob([output.data], { type: "image/svg+xml" });
      if (result?.url) URL.revokeObjectURL(result.url);
      const savings =
        input.length > 0
          ? Math.round((1 - output.data.length / input.length) * 100)
          : 0;
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        savings,
      });
      incrementFeatureUsage("images.svgOptimize");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("images.svgOptimizePage.genericError"),
      );
    } finally {
      setProcessing(false);
    }
  }, [file, result?.url, t]);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result?.url]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/images" />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-500/10 text-lime-600 dark:text-lime-400">
          <Minimize2 className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("images.tools.svgOptimize.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("images.tools.svgOptimize.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="space-y-2">
            <Label>{t("images.imageLabel")}</Label>
            <FileDropzone
              accept={{ "image/svg+xml": [".svg"] }}
              value={file}
              onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
              hint={t("images.svgOptimizePage.dropzoneHint")}
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
          <Button onClick={handleOptimize} disabled={!file || processing}>
            {processing ? "…" : t("images.svgOptimizePage.optimizeBtn")}
          </Button>
        </CardFooter>
      </Card>

      {result && file && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("images.svgOptimizePage.savings", { percent: result.savings })}
          </p>
          <a
            href={result.url}
            download={`${baseName(file.name)}-optimized.svg`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("images.downloadResult")}
          </a>
        </div>
      )}
    </main>
  );
}
