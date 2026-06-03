import { BackLink } from "@/components/BackLink";
import { CHANGELOG_RELEASES } from "@/data/changelog";
import { version } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

function formatDate(date: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date + "T12:00:00"));
  } catch {
    return date;
  }
}

export function Changelog() {
  const { t, i18n } = useTranslation();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/" />

      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScrollText className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("changelog.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("changelog.subtitle")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("changelog.currentVersion", { version })}
          </p>
        </div>
      </div>

      <ol className="relative flex flex-col gap-8 border-l border-border pl-6">
        {CHANGELOG_RELEASES.map(({ version: releaseVersion, date, i18nKey }, index) => {
          const items = t(`changelog.versions.${i18nKey}.items`, {
            returnObjects: true,
          }) as string[] | string;
          const list = Array.isArray(items) ? items : [];

          return (
            <li key={i18nKey} className="relative">
              <span
                className={cn(
                  "absolute -left-[calc(1.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                  index === 0 ? "bg-primary" : "bg-muted-foreground/50",
                )}
                aria-hidden
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-lg font-semibold">v{releaseVersion}</h2>
                <time
                  dateTime={date}
                  className="text-sm text-muted-foreground"
                >
                  {formatDate(date, i18n.language)}
                </time>
                {index === 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {t("changelog.latest")}
                  </span>
                )}
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
                {list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
