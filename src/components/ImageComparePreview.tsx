import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ImageComparePreviewProps = {
  originalUrl: string | null;
  previewUrl: string | null;
  originalLabel: string;
  previewLabel: string;
  loading?: boolean;
  fileName?: string;
  className?: string;
};

export function ImageComparePreview({
  originalUrl,
  previewUrl,
  originalLabel,
  previewLabel,
  loading = false,
  fileName,
  className,
}: ImageComparePreviewProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {fileName && (
        <p className="truncate text-xs font-medium text-muted-foreground">
          {fileName}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewPane label={originalLabel} url={originalUrl} loading={loading} />
        <PreviewPane
          label={previewLabel}
          url={previewUrl}
          loading={loading}
          highlight
        />
      </div>
    </div>
  );
}

function PreviewPane({
  label,
  url,
  loading,
  highlight = false,
}: {
  label: string;
  url: string | null;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className={cn(
          "relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-lg border bg-muted/40",
          highlight && "ring-2 ring-primary/30",
        )}
      >
        {loading ? (
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : url ? (
          <img
            src={url}
            alt={label}
            className="max-h-[min(50vh,320px)] w-full object-contain p-2"
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}
