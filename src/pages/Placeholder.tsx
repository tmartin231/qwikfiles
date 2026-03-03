import { useTranslation } from "react-i18next";
import { BackLink } from "@/components/BackLink";

type PlaceholderProps = {
  title?: string;
  titleKey?: string;
  backTo?: string;
};

export function Placeholder({
  title,
  titleKey,
  backTo = "/",
}: PlaceholderProps) {
  const { t } = useTranslation();
  const displayTitle = titleKey ? t(titleKey) : title ?? "";
  return (
    <main className="mx-auto flex flex-1 max-w-[1820px] flex-col items-center justify-center gap-6 px-4 py-12">
      <h2 className="text-2xl font-semibold">{displayTitle}</h2>
      <p className="text-muted-foreground">{t("placeholder.comingSoon")}</p>
      <BackLink
        to={backTo}
        className="text-primary underline underline-offset-4 hover:no-underline"
      />
    </main>
  );
}
