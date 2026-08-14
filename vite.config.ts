import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// Bake the version (and its release highlights) that's current at build time
// into the bundle, so a running app instance always knows its own version and
// changelog even after a newer one is deployed.
const versionData = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./public/version.json", import.meta.url)),
    "utf-8"
  )
);
const currentVersionEntry = versionData.history.find(
  (entry: { version: string }) => entry.version === versionData.current
);

// The app shows version.json's `current`; npm and every tool that reads the
// manifest show package.json's `version`. They're two hand-edited copies of
// one fact, and they did drift — four releases shipped while the running app
// still reported 1.0.23, because only package.json had been bumped. Failing
// the build is the cheapest possible place to catch that: `npm run release`
// updates both together, and this makes forgetting impossible rather than
// merely unlikely.
const pkgVersion = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8")
).version;

if (pkgVersion !== versionData.current) {
  throw new Error(
    `Version mismatch: package.json is ${pkgVersion} but public/version.json is ${versionData.current}.\n` +
      `Run "npm run release" to bump both together.`
  );
}

if (!currentVersionEntry) {
  throw new Error(
    `public/version.json lists current="${versionData.current}" but has no history entry for it — ` +
      `the "what's new" notice would come up empty.`
  );
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(versionData.current),
    __APP_CHANGELOG__: JSON.stringify(currentVersionEntry?.highlights ?? []),
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon-180x180.png",
      ],
      manifest: {
        id: "/",
        name: "Gampetoo",
        short_name: "Gampetoo",
        description: "برنامه تمرینی و غذایی روزانه",
        lang: "fa",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#18181b",
        background_color: "#18181b",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        // Wait for the user to accept the update (prompt), but once the new
        // worker activates, claim the page so it reliably reloads into the new
        // version instead of leaving the update banner lingering.
        skipWaiting: false,
        clientsClaim: true,
        // Without this, an old worker's precache entries (previous builds'
        // hashed asset filenames) stick around in Cache Storage indefinitely
        // — on a device that's been through several updates, that's stale
        // data piling up that a fetch could resolve against instead of the
        // current precache, especially under WebKit's flakier Cache Storage
        // behavior. Workbox's own recommended default for exactly this.
        cleanupOutdatedCaches: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});