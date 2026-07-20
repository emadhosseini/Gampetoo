import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// iOS Safari only applies the :active pseudo-class to elements that aren't a
// button/anchor if a touchstart listener exists somewhere in the document —
// otherwise our glass blocks would never show their touch/press feedback.
document.addEventListener("touchstart", () => {}, { passive: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);