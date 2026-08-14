#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, URL } from "node:url";
import { stdin, stdout } from "node:process";

/**
 * One command that moves the version in every place that holds it.
 *
 * The app displays public/version.json's `current` (vite bakes it into the
 * bundle) while package.json's `version` is what npm and the build banner
 * report — and for four releases running, only the latter got bumped, so
 * the shipped app kept insisting it was 1.0.23. Two files that must agree
 * but are updated by hand will drift; this makes one action update both,
 * and `npm run build` now refuses to run if they ever disagree again.
 *
 *   npm run release                     -> patch bump, asks for the notes
 *   npm run release -- 1.1.0            -> explicit version
 *   npm run release -- --desc "..." --highlight "..." --highlight "..."
 */

const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const PKG = path("../package.json");
const VERSION_JSON = path("../public/version.json");

const readJson = (file) => JSON.parse(readFileSync(file, "utf-8"));
const writeJson = (file, data) =>
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

function parseArgs(argv) {
  const out = { version: null, desc: null, highlights: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--desc") out.desc = argv[++i];
    else if (arg === "--highlight") out.highlights.push(argv[++i]);
    else if (!arg.startsWith("--")) out.version = arg;
  }

  return out;
}

function nextPatch(version) {
  const [major, minor, patch] = version.split(".").map(Number);

  if ([major, minor, patch].some(Number.isNaN)) {
    throw new Error(`can't parse version "${version}"`);
  }

  return `${major}.${minor}.${patch + 1}`;
}

// Local date, not toISOString() — that's UTC, which stamps yesterday on any
// release cut after ~03:30 local in Iran (same trap dateFormat.ts documents).
function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const args = parseArgs(process.argv.slice(2));
const pkg = readJson(PKG);
const versionFile = readJson(VERSION_JSON);

const version = args.version ?? nextPatch(versionFile.current);

if (versionFile.history.some((entry) => entry.version === version)) {
  console.error(`✗ ${version} is already in public/version.json's history.`);
  process.exit(1);
}

let { desc, highlights } = args;

// Only prompt for what wasn't passed in, so the same script serves both a
// human at a terminal and a scripted/CI release.
if (!desc || highlights.length === 0) {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log(`\nReleasing ${versionFile.current} → ${version}\n`);

  desc ??= await rl.question("Description (English, one or two sentences):\n> ");

  if (highlights.length === 0) {
    console.log("\nHighlights (Persian, one per line — empty line to finish):");

    for (;;) {
      const line = (await rl.question("> ")).trim();

      if (!line) break;

      highlights.push(line);
    }
  }

  rl.close();
}

if (!desc?.trim()) {
  console.error("✗ a description is required.");
  process.exit(1);
}

if (highlights.length === 0) {
  console.error("✗ at least one highlight is required — it's what users see.");
  process.exit(1);
}

pkg.version = version;
writeJson(PKG, pkg);

versionFile.current = version;
versionFile.history.unshift({
  version,
  date: today(),
  description: desc.trim(),
  highlights,
});
writeJson(VERSION_JSON, versionFile);

console.log(`\n✓ ${version} written to package.json and public/version.json`);
console.log(`  ${highlights.length} highlight(s), dated ${today()}`);
console.log("\nNext: npm run build && git commit");
