import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  to: string;
  labelKey?: string;
  className?: string;
};

export function BackLink({
  to,
  labelKey = "placeholder.backToOverview",
  className,
}: BackLinkProps) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className={cn(
        "mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      ← {t(labelKey)}
    </Link>
  );
}

