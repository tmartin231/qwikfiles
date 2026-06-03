/** Release metadata – Inhalte über i18n: changelog.versions.{key}.items */
export type ChangelogRelease = {
  version: string;
  date: string;
  i18nKey: string;
};

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  { version: "1.3.3", date: "2026-06-03", i18nKey: "v1_3_3" },
  { version: "1.3.2", date: "2026-06-02", i18nKey: "v1_3_2" },
  { version: "1.3.1", date: "2026-06-02", i18nKey: "v1_3_1" },
  { version: "1.3.0", date: "2026-06-02", i18nKey: "v1_3_0" },
  { version: "1.2.1", date: "2026-06-02", i18nKey: "v1_2_1" },
  { version: "1.2.0", date: "2026-06-02", i18nKey: "v1_2_0" },
  { version: "1.1.0", date: "2026-03-04", i18nKey: "v1_1_0" },
  { version: "1.0.0", date: "2026-03-03", i18nKey: "v1_0_0" },
];
