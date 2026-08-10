import { getAppSettings } from "@/utils/appSettingsEngine";
import { translations, type TranslationKey } from "./translations";

/**
 * Reads the language setting fresh on every call (same pattern as
 * dateFormat.ts's "Display" formatters and toFaDigits) rather than through
 * a hook — this app has no reactive store, and language switches take
 * effect via SettingsSidebar's own reload after Save, same as theme and
 * calendar. Falls back to fa on a key missing from the en dictionary so a
 * partially-translated page still renders real text instead of a raw key.
 *
 * `vars`, if given, fills "{name}" placeholders in the string — e.g.
 * t("home.startsInDays", { days: "3" }).
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const lang = getAppSettings().language;
  const raw: string = translations[lang]?.[key] ?? translations.fa[key] ?? key;

  if (!vars) return raw;

  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    raw,
  );
}
