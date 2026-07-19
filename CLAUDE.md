# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first, single-user personal fitness/nutrition tracker ("Gampetoo") built as a client-only React SPA — no backend, no auth. All state lives in the browser's `localStorage`. The UI is Persian (fa) with RTL layout (`Vazirmatn` font, `direction: rtl` set globally in `src/index.css`); some strings in the codebase are still English, so don't assume one language throughout.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build      # tsc -b (project references) then vite build
npm run lint       # oxlint — this is the active linter (see Linting below)
npm run preview    # preview a production build
```

There is no test suite/framework configured in this repo (no test script, no vitest/jest in package.json). Don't assume one exists.

### Linting

`oxlint` (`.oxlintrc.json`) is the linter actually wired up via `npm run lint`. ESLint packages (`eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-simple-import-sort`, `eslint-config-prettier`) are present in `devDependencies` but there is no ESLint config file and no `lint:eslint`-style script — they are currently unused. Prettier config exists (`.prettierrc`: double-quote-off i.e. `"singleQuote": false`, semicolons, trailing commas, 100 print width) but there's no `format` script either; run `npx prettier --write` directly if needed.

## Architecture

### Routing / bootstrap gate

`src/App.tsx` decides the entire route tree based on `hasStartDate()` (from `programEngine`): if the active program has no `startDate` yet, **every** route redirects to `/setup` (`SetupProgramPage`), which is rendered outside the normal `Layout` shell. Once a start date exists, the full route tree renders inside `Layout` (mobile shell + bottom nav): `/`, `/workout`, `/nutrition`, `/settings`, `/settings/workouts`, `/settings/workouts/:id`, `/settings/program`.

`Layout` → `MobileContainer` (fixed `max-w-md` phone-shaped viewport) + `BottomNavigation`, with page content in an `Outlet`.

### No state management library — direct localStorage read/write

There's no Redux/Zustand/Context for domain data. Instead, plain functions in `src/utils/*Engine.ts` and `src/store/*.ts` read/write JSON blobs directly to `localStorage` on every call (each module owns its own `STORAGE_KEY` constant). Pages call these functions directly during render — there's no subscription/reactivity layer, so **after a mutation, screens that need to reflect the change typically force a full reload** (e.g. `window.location.reload()` in `ProgramBuilderPage` after `updateWorkoutDay`). Keep this pattern in mind: don't assume state updates will re-render other components the way they would with React state/context.

Key persistence modules:
- `src/utils/programEngine.ts` (`emad-programs` key) — CRUD for `ProgramsState`/`Program`, plus day-of-cycle math (`getProgramDayIndex`, `getCycleDayIndex`, `getCurrentProgramDay`, `getCurrentWorkoutType`, `getCurrentMealPlan`). The program's workout cycle repeats based on `startDate` and the length of `workout.days`.
- `src/utils/sessionEngine.ts` (`emad-session` key) — today's completion state (`completeWorkout`/`completeWalk`/`resetSession`), auto-resets `completed` when the date rolls over.
- `src/utils/storage.ts` (`emad-workout` key) — a separate, simpler "workout completed" flag; overlaps conceptually with `sessionEngine` — check which one a given screen actually reads before adding to either.
- `src/store/workoutLibraryStore.ts` (`emad-workout-library-overrides` key) — per-exercise user overrides (`enabled`/`sets`/`reps`) layered on top of the static `workoutLibrary` seed data via `getLibrary()`/`getWorkout()`.
- `src/domain/reset/resetApplication.ts` — aggregates the various `reset*()` calls into one "factory reset" entry point. New persistence modules that should be wiped on reset need to be added here explicitly.

### Static seed data vs. user data

`src/data/` holds static definitions that seed the persisted state:
- `src/data/workoutLibrary.ts` — the exercise database (`WorkoutDefinition[]`, keyed by `WorkoutType`), overridden per-user via `workoutLibraryStore`.
- `src/data/program/defaultProgram.ts` + `src/data/nutrition/mealPlans.ts` — default `Program`/`MealPlan` used when no program exists yet.

`src/data/programs.ts` and `src/data/todayWorkout.ts`, and `src/utils/activityEngine.ts`, are leftover from an earlier iteration and are no longer imported anywhere — the current data flow goes through `program/defaultProgram.ts` + `programEngine.ts`/`workoutLibraryStore.ts` instead. Verify with a repo-wide grep before touching or building on them; they're likely safe to delete rather than extend.

### Types

Domain types live in `src/types/` (`program.ts`, `nutrition.ts`, `WorkoutSettings.ts`) and are imported with `import type`. `WorkoutType` (`push`/`pull`/`legs`/`upper`/`lower`/`full_body`/`cardio`/`custom`) is the id space shared between `Program.workout.days[].workoutId` and `workoutLibrary` entries.

### Path alias

`@/*` maps to `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`). Use `@/...` imports in new code — existing files are a mix of `@/` and relative imports.

### Styling

Tailwind CSS v4, wired via the `@tailwindcss/vite` plugin (no `tailwind.config.*` file — v4 uses the CSS-first `@import "tailwindcss"` in `src/index.css`, no separate config needed). Dark theme is hardcoded (zinc/black backgrounds, white text), not toggle-based. Icons via `lucide-react`.
