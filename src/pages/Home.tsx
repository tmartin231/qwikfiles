import { FileCode, FileText, Image } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { FeatureId } from "@/lib/usage-tracking";
import { readFeatureUsage } from "@/lib/usage-tracking";

const categories = [
  {
    to: "/images",
    key: "images",
    icon: Image,
    className:
      "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  {
    to: "/pdf",
    key: "pdf",
    icon: FileText,
    className:
      "from-rose-500/10 to-red-500/10 border-rose-500/20 hover:border-rose-500/40",
    iconClassName: "text-rose-600 dark:text-rose-400",
  },
  {
    to: "/files",
    key: "files",
    icon: FileCode,
    className:
      "from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
] as const;

type FeatureCard = {
  id: FeatureId;
  to: string;
  titleKey: string;
  descriptionKey: string;
  icon: typeof Image;
  className: string;
  iconClassName: string;
};

const ALL_FEATURES: Record<FeatureId, FeatureCard> = {
  "images.convert": {
    id: "images.convert",
    to: "/images/convert",
    titleKey: "images.tools.convert.title",
    descriptionKey: "images.tools.convert.description",
    icon: Image,
    className:
      "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  "images.compress": {
    id: "images.compress",
    to: "/images/compress",
    titleKey: "images.tools.compress.title",
    descriptionKey: "images.tools.compress.description",
    icon: Image,
    className:
      "from-sky-500/10 to-blue-500/10 border-sky-500/20 hover:border-sky-500/40",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  "images.resize": {
    id: "images.resize",
    to: "/images/resize",
    titleKey: "images.tools.resize.title",
    descriptionKey: "images.tools.resize.description",
    icon: Image,
    className:
      "from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  "images.crop": {
    id: "images.crop",
    to: "/images/crop",
    titleKey: "images.tools.crop.title",
    descriptionKey: "images.tools.crop.description",
    icon: Image,
    className:
      "from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  "images.rotate": {
    id: "images.rotate",
    to: "/images/rotate",
    titleKey: "images.tools.rotate.title",
    descriptionKey: "images.tools.rotate.description",
    icon: Image,
    className:
      "from-cyan-500/10 to-sky-500/10 border-cyan-500/20 hover:border-cyan-500/40",
    iconClassName: "text-cyan-600 dark:text-cyan-400",
  },
  "images.stripMetadata": {
    id: "images.stripMetadata",
    to: "/images/strip-metadata",
    titleKey: "images.tools.stripMetadata.title",
    descriptionKey: "images.tools.stripMetadata.description",
    icon: Image,
    className:
      "from-slate-500/10 to-zinc-500/10 border-slate-500/20 hover:border-slate-500/40",
    iconClassName: "text-slate-600 dark:text-slate-400",
  },
  "pdf.merge": {
    id: "pdf.merge",
    to: "/pdf/merge",
    titleKey: "pdf.tools.merge.title",
    descriptionKey: "pdf.tools.merge.description",
    icon: FileText,
    className:
      "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  "pdf.split": {
    id: "pdf.split",
    to: "/pdf/split",
    titleKey: "pdf.tools.split.title",
    descriptionKey: "pdf.tools.split.description",
    icon: FileText,
    className:
      "from-sky-500/10 to-blue-500/10 border-sky-500/20 hover:border-sky-500/40",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  "pdf.convert": {
    id: "pdf.convert",
    to: "/pdf/convert",
    titleKey: "pdf.tools.convert.title",
    descriptionKey: "pdf.tools.convert.description",
    icon: FileText,
    className:
      "from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  "pdf.toPdf": {
    id: "pdf.toPdf",
    to: "/pdf/to-pdf",
    titleKey: "pdf.tools.toPdf.title",
    descriptionKey: "pdf.tools.toPdf.description",
    icon: FileText,
    className:
      "from-rose-500/10 to-orange-500/10 border-rose-500/20 hover:border-rose-500/40",
    iconClassName: "text-rose-600 dark:text-rose-400",
  },
  "pdf.compress": {
    id: "pdf.compress",
    to: "/pdf/compress",
    titleKey: "pdf.tools.compress.title",
    descriptionKey: "pdf.tools.compress.description",
    icon: FileText,
    className:
      "from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:border-orange-500/40",
    iconClassName: "text-orange-600 dark:text-orange-400",
  },
  "pdf.rotate": {
    id: "pdf.rotate",
    to: "/pdf/rotate",
    titleKey: "pdf.tools.rotate.title",
    descriptionKey: "pdf.tools.rotate.description",
    icon: FileText,
    className:
      "from-indigo-500/10 to-violet-500/10 border-indigo-500/20 hover:border-indigo-500/40",
    iconClassName: "text-indigo-600 dark:text-indigo-400",
  },
  "pdf.extract": {
    id: "pdf.extract",
    to: "/pdf/extract",
    titleKey: "pdf.tools.extract.title",
    descriptionKey: "pdf.tools.extract.description",
    icon: FileText,
    className:
      "from-teal-500/10 to-cyan-500/10 border-teal-500/20 hover:border-teal-500/40",
    iconClassName: "text-teal-600 dark:text-teal-400",
  },
  "pdf.unlock": {
    id: "pdf.unlock",
    to: "/pdf/unlock",
    titleKey: "pdf.tools.unlock.title",
    descriptionKey: "pdf.tools.unlock.description",
    icon: FileText,
    className:
      "from-yellow-500/10 to-amber-500/10 border-yellow-500/20 hover:border-yellow-500/40",
    iconClassName: "text-yellow-600 dark:text-amber-400",
  },
  "pdf.imagesToPdf": {
    id: "pdf.imagesToPdf",
    to: "/pdf/images-to-pdf",
    titleKey: "pdf.tools.imagesToPdf.title",
    descriptionKey: "pdf.tools.imagesToPdf.description",
    icon: FileText,
    className:
      "from-pink-500/10 to-rose-500/10 border-pink-500/20 hover:border-rose-500/40",
    iconClassName: "text-pink-600 dark:text-pink-400",
  },
  "images.favicon": {
    id: "images.favicon",
    to: "/images/favicon",
    titleKey: "images.tools.favicon.title",
    descriptionKey: "images.tools.favicon.description",
    icon: Image,
    className:
      "from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/20 hover:border-fuchsia-500/40",
    iconClassName: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  "images.svgOptimize": {
    id: "images.svgOptimize",
    to: "/images/svg-optimize",
    titleKey: "images.tools.svgOptimize.title",
    descriptionKey: "images.tools.svgOptimize.description",
    icon: Image,
    className:
      "from-lime-500/10 to-green-500/10 border-lime-500/20 hover:border-lime-500/40",
    iconClassName: "text-lime-600 dark:text-lime-400",
  },
  "files.convert": {
    id: "files.convert",
    to: "/files/convert",
    titleKey: "files.tools.convert.title",
    descriptionKey: "files.tools.convert.description",
    icon: FileCode,
    className:
      "from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  "files.base64": {
    id: "files.base64",
    to: "/files/base64",
    titleKey: "files.tools.base64.title",
    descriptionKey: "files.tools.base64.description",
    icon: FileCode,
    className:
      "from-sky-500/10 to-blue-500/10 border-sky-500/20 hover:border-sky-500/40",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  "files.diff": {
    id: "files.diff",
    to: "/files/diff",
    titleKey: "files.tools.diff.title",
    descriptionKey: "files.tools.diff.description",
    icon: FileCode,
    className:
      "from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  "files.format": {
    id: "files.format",
    to: "/files/format",
    titleKey: "files.tools.format.title",
    descriptionKey: "files.tools.format.description",
    icon: FileCode,
    className:
      "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
};

export function Home() {
  const { t } = useTranslation();
  const [topFeatures] = useState<FeatureCard[]>(() => {
    const usage = readFeatureUsage();
    const entries = Object.entries(usage) as [FeatureId, number][];
    if (!entries.length) return [];
    entries.sort((a, b) => b[1] - a[1]);
    const picked: FeatureCard[] = [];
    for (const [id] of entries) {
      const def = ALL_FEATURES[id];
      if (def && !picked.some((p) => p.id === id)) picked.push(def);
      if (picked.length === 3) break;
    }
    return picked;
  });
  return (
    <main className="flex w-full">
      <div className="mx-auto w-full max-w-4xl flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row">
            {categories.map(
            ({ to, key, icon: Icon, className, iconClassName }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex min-w-0 flex-1 flex-col rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200",
                  "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "bg-linear-to-br",
                  className,
                )}
              >
                <div
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-background/80",
                    iconClassName,
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="mb-2 text-lg font-semibold">
                  {t(`home.categories.${key}.title`)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(`home.categories.${key}.description`)}
                </p>
              </Link>
            ),
            )}
          </div>

          {topFeatures.length > 0 && (
            <section className="mt-4 flex flex-col gap-3 sm:mt-2">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-lg font-semibold">
                  {t("home.mostUsed.title")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("home.mostUsed.subtitle")}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topFeatures.map(
                  ({
                    id,
                    to,
                    titleKey,
                    descriptionKey,
                    icon: Icon,
                    className,
                    iconClassName,
                  }) => (
                    <Link
                      key={id}
                      to={to}
                      className={cn(
                        "group flex flex-col rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200",
                        "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "bg-linear-to-br",
                        className,
                      )}
                    >
                      <div
                        className={cn(
                          "mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-background/80",
                          iconClassName,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <h3 className="mb-1 text-sm font-semibold">
                        {t(titleKey)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t(descriptionKey)}
                      </p>
                    </Link>
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
