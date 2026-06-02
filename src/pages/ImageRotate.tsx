import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BackLink } from "@/components/BackLink";
import { ImageComparePreview } from "@/components/ImageComparePreview";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  applyTransform,
  canvasToBlob,
  canvasToPreviewUrl,
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
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import JSZip from "jszip";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type PreviewItem = {
  fileName: string;
  originalUrl: string;
  previewUrl: string;
};

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

async function buildPreviewItem(
  file: File,
  transform: ImageTransform,
): Promise<PreviewItem> {
  const decoded = await decodeImageFile(file);
  const canvas = await loadImageToCanvas(decoded);
  const transformed = applyTransform(canvas, transform);
  return {
    fileName: file.name,
    originalUrl: canvasToPreviewUrl(canvas),
    previewUrl: canvasToPreviewUrl(transformed),
  };
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
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const previewGenRef = useRef(0);

  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      setPreviewLoading(false);
      return;
    }

    const generation = ++previewGenRef.current;
    setPreviewLoading(true);
    setError(null);

    void (async () => {
      try {
        const items = await Promise.all(
          files.map((file) => buildPreviewItem(file, transform)),
        );
        if (previewGenRef.current !== generation) return;
        setPreviews(items);
      } catch (e) {
        if (previewGenRef.current !== generation) return;
        const msg =
          e instanceof Error && e.message === TIFF_PARSE_ERROR
            ? t("images.errors.tiffParseError")
            : e instanceof Error
              ? e.message
              : t("images.rotatePage.genericError");
        setError(msg);
        setPreviews([]);
      } finally {
        if (previewGenRef.current === generation) setPreviewLoading(false);
      }
    })();
  }, [files, transform, t]);

  const handleDownload = useCallback(async () => {
    if (files.length === 0 || previews.length === 0) return;
    setError(null);
    setDownloading(true);
    try {
      const decoded = await Promise.all(files.map(decodeImageFile));
      const converted = await Promise.all(
        decoded.map(async (decodedFile, i) => {
          const file = files[i]!;
          const { blob, ext } = await transformImage(decodedFile, transform);
          return { blob, baseName: baseName(file.name), ext };
        }),
      );

      if (converted.length === 1) {
        const { blob, baseName: name, ext } = converted[0]!;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        converted.forEach(({ blob, baseName: name, ext }, i) => {
          const uniqueName =
            converted.length > 1 ? `${name}_${i + 1}.${ext}` : `${name}.${ext}`;
          zip.file(uniqueName, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rotated-images.zip";
        a.click();
        URL.revokeObjectURL(url);
      }
      incrementFeatureUsage("images.rotate");
    } catch (e) {
      const msg =
        e instanceof Error && e.message === TIFF_PARSE_ERROR
          ? t("images.errors.tiffParseError")
          : e instanceof Error
            ? e.message
            : t("images.rotatePage.genericError");
      setError(msg);
    } finally {
      setDownloading(false);
    }
  }, [files, transform, previews.length, t]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setError(null);
    setTransform("rotate90");
  }, []);

  const handleFileChange = useCallback((v: File | File[] | null) => {
    if (v === null) setFiles([]);
    else setFiles(Array.isArray(v) ? v : [v]);
  }, []);

  const canDownload =
    files.length > 0 && previews.length === files.length && !previewLoading;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-4 py-8">
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

          {files.length > 0 && (
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
          )}

          {files.length > 0 && (
            <div className="space-y-4 border-t border-border pt-6">
              <div>
                <p className="text-sm font-medium">{t("images.preview.title")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("images.preview.rotateHint")}
                </p>
              </div>
              {previews.length === 1 ? (
                <ImageComparePreview
                  originalUrl={previews[0]?.originalUrl ?? null}
                  previewUrl={previews[0]?.previewUrl ?? null}
                  originalLabel={t("images.preview.original")}
                  previewLabel={t("images.preview.result")}
                  loading={previewLoading}
                />
              ) : (
                <div className="flex flex-col gap-6">
                  {previews.map((item) => (
                    <ImageComparePreview
                      key={item.fileName}
                      fileName={item.fileName}
                      originalUrl={item.originalUrl}
                      previewUrl={item.previewUrl}
                      originalLabel={t("images.preview.original")}
                      previewLabel={t("images.preview.result")}
                      loading={previewLoading}
                    />
                  ))}
                  {previewLoading && previews.length === 0 && (
                    <ImageComparePreview
                      originalUrl={null}
                      previewUrl={null}
                      originalLabel={t("images.preview.original")}
                      previewLabel={t("images.preview.result")}
                      loading
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            className="min-w-28 gap-2"
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloading
              ? "…"
              : files.length > 1
                ? t("images.downloadZip")
                : t("images.downloadResult")}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={files.length === 0}
          >
            {t("images.resetBtn")}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
