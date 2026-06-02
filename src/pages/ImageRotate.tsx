import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BackLink } from "@/components/BackLink";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  applyTransform,
  canvasToBlob,
  loadImageToCanvas,
  type ImageTransform,
} from "@/lib/image-canvas";
import {
  baseName,
  decodeImageFile,
  getOutputMimeAndExt,
  TIFF_PARSE_ERROR,
} from "@/lib/image-utils";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import {
  Download,
  FileArchive,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import JSZip from "jszip";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

async function transformImage(
  file: File,
  transform: ImageTransform,
): Promise<{ blob: Blob; ext: string }> {
  const canvas = await loadImageToCanvas(file);
  const transformed = applyTransform(canvas, transform);
  const { mime, ext } = getOutputMimeAndExt(file, "resize");
  const blob = await canvasToBlob(transformed, mime);
  return { blob, ext };
}

const TRANSFORMS: {
  id: ImageTransform;
  labelKey: string;
  icon: typeof RotateCw;
}[] = [
  { id: "rotate90", labelKey: "rotate90", icon: RotateCw },
  { id: "rotate270", labelKey: "rotate270", icon: RotateCcw },
  { id: "rotate180", labelKey: "rotate180", icon: RotateCw },
  { id: "flipH", labelKey: "flipH", icon: FlipHorizontal },
  { id: "flipV", labelKey: "flipV", icon: FlipVertical },
];

export function ImageRotate() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [transform, setTransform] = useState<ImageTransform>("rotate90");
  const [results, setResults] = useState<
    { blob: Blob; baseName: string; ext: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrls, setResultUrls] = useState<string[]>([]);

  const handleApply = useCallback(async () => {
    if (files.length === 0) return;
    setError(null);
    setProcessing(true);
    try {
      const decoded = await Promise.all(files.map(decodeImageFile));
      const converted = await Promise.all(
        decoded.map(async (decodedFile, i) => {
          const file = files[i]!;
          const { blob, ext } = await transformImage(decodedFile, transform);
          return { blob, baseName: baseName(file.name), ext };
        }),
      );
      setResults(converted);
      incrementFeatureUsage("images.rotate");
    } catch (e) {
      const msg =
        e instanceof Error && e.message === TIFF_PARSE_ERROR
          ? t("images.errors.tiffParseError")
          : e instanceof Error
            ? e.message
            : t("images.rotatePage.genericError");
      setError(msg);
      setResults([]);
    } finally {
      setProcessing(false);
    }
  }, [files, transform, t]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResults([]);
    setError(null);
    setTransform("rotate90");
  }, []);

  const handleFileChange = useCallback((v: File | File[] | null) => {
    if (v === null) setFiles([]);
    else setFiles(Array.isArray(v) ? v : [v]);
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
      const uniqueName =
        results.length > 1 ? `${name}_${i + 1}.${ext}` : `${name}.${ext}`;
      zip.file(uniqueName, blob);
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rotated-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/images" />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
          <RotateCw className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("images.tools.rotate.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("images.tools.rotate.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="space-y-2">
            <Label>{t("images.imageLabel")}</Label>
            <FileDropzone
              multiple
              value={files}
              addMoreLabel={t("images.addMoreFiles")}
              onFileChange={handleFileChange}
              hint={t("images.dropzoneHint")}
              activeHint={t("images.dropzoneActive")}
              removeLabel={t("images.removeFile")}
              fileCountLabel={(count) => t("images.filesSelected", { count })}
              multipleHint={t("images.multipleHint")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("images.rotatePage.actionLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {TRANSFORMS.map(({ id, labelKey, icon: Icon }) => (
                <Button
                  key={id}
                  type="button"
                  variant={transform === id ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setTransform(id)}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t(`images.rotatePage.actions.${labelKey}`)}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleApply}
            disabled={files.length === 0 || processing}
            className="min-w-28"
          >
            {processing ? "…" : t("images.rotatePage.applyBtn")}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={files.length === 0 && results.length === 0}
          >
            {t("images.resetBtn")}
          </Button>
        </CardFooter>
      </Card>

      {results.length > 0 && resultUrls.length === results.length && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("images.imagesReady", { count: results.length })}
          </p>
          <div className="flex flex-wrap gap-3">
            {results.length === 1 ? (
              <a
                href={resultUrls[0]}
                download={`${results[0].baseName}.${results[0].ext}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="h-4 w-4" aria-hidden />
                {t("images.downloadResult")}
              </a>
            ) : (
              <Button type="button" className="gap-2" onClick={handleDownloadZip}>
                <FileArchive className="h-4 w-4" aria-hidden />
                {t("images.downloadZip")}
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
