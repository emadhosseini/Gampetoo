import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { getAppSettings } from "./utils/appSettingsEngine";

// iOS Safari only applies the :active pseudo-class to elements that aren't a
// button/anchor if a touchstart listener exists somewhere in the document —
// otherwise our glass blocks would never show their touch/press feedback.
document.addEventListener("touchstart", () => {}, { passive: true });

// Applied once on boot, before the first paint — every themed rule in
// index.css keys off this attribute (see the [data-theme="light"] block),
// so it has to be on <html> before React even mounts. SettingsSidebar's
// own "ذخیره" flow reloads the page after writing the setting rather than
// trying to flip this live, which is what actually picks the change up.
const settings = getAppSettings();
document.documentElement.dataset.theme = settings.theme;

// lang/dir likewise have to land before first paint — index.html's own
// lang="fa" dir="rtl" is only the pre-JS fallback for the split second
// before this runs. English reads left-to-right; index.css's html rule no
// longer hardcodes direction, it now follows whichever of these wins here.
document.documentElement.lang = settings.language;
document.documentElement.dir = settings.language === "en" ? "ltr" : "rtl";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);