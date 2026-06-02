import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BackLink } from "@/components/BackLink";
import {
  ArrowLeftRight,
  Binary,
  FileCode,
  FileDiff,
  FileText,
} from "lucide-react";

const FILE_TOOLS = [
  {
    key: "convert",
    to: "/files/convert",
    icon: ArrowLeftRight,
    className:
      "from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "base64",
    to: "/files/base64",
    icon: Binary,
    className:
      "from-sky-500/10 to-blue-500/10 border-sky-500/20 hover:border-sky-500/40",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  {
    key: "diff",
    to: "/files/diff",
    icon: FileDiff,
    className:
      "from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "format",
    to: "/files/format",
    icon: FileText,
    className:
      "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
] as const;

export function FilesHub() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-4 py-8">
      <BackLink to="/" />

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <FileCode className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("files.hub.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("files.hub.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FILE_TOOLS.map(({ key, to, icon: Icon, className, iconClassName }) => (
          <Link
            key={key}
            to={to}
            className={cn(
              "group flex flex-col rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200",
              "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
            <h2 className="mb-1 text-lg font-semibold">
              {t(`files.tools.${key}.title`)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(`files.tools.${key}.description`)}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
