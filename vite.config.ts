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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Wait for the user to accept the update (prompt), but once the new
        // worker activates, claim the page so it reliably reloads into the new
        // version instead of leaving the update banner lingering.
        skipWaiting: false,
        clientsClaim: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});