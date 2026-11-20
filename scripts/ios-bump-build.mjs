#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

/**
 * Increments CURRENT_PROJECT_VERSION across every target in
 * ios/App/App.xcodeproj/project.pbxproj (both App and GampetooWidgets stay in
 * lockstep, as required by App Store Connect / TestFlight).
 *
 * Optionally syncs MARKETING_VERSION to match package.json too.
 *
 * Usage:
 *   npm run ios:bump
 */
const PBXPROJ = fileURLToPath(
  new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url),
);
const PKG = fileURLToPath(new URL("../package.json", import.meta.url));

if (!existsSync(PBXPROJ)) {
  console.error("✗ ios/App/App.xcodeproj/project.pbxproj not found.");
  process.exit(1);
}

const pkgVersion = JSON.parse(readFileSync(PKG, "utf-8")).version;
let content = readFileSync(PBXPROJ, "utf-8");

const buildMatches = [...content.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)];
if (buildMatches.length === 0) {
  console.error("✗ No CURRENT_PROJECT_VERSION entries found in project.pbxproj.");
  process.exit(1);
}

const currentBuild = Math.max(...buildMatches.map((m) => Number(m[1])));
const nextBuild = currentBuild + 1;

content = content
  .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${nextBuild};`)
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${pkgVersion};`);

writeFileSync(PBXPROJ, content, "utf-8");

console.log(
  `✓ iOS version synced: MARKETING_VERSION = ${pkgVersion}, CURRENT_PROJECT_VERSION = ${currentBuild} → ${nextBuild}`,
);
