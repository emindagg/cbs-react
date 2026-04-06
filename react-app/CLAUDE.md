# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173/cbs-react/
npm run build        # tsc -b && vite build
npm run preview      # Preview production build

# Lint
npm run lint         # Lint src/**/*.{ts,tsx}
npm run lint:fix     # Auto-fix lint errors
npm run lint:strict  # Zero warnings allowed

# Test
npm run test         # Vitest interactive
npm run test:run     # Single run (CI)
npm run test:coverage  # Run with coverage (threshold: 70%)
npm run test:watch   # Watch mode

# Utilities
npm run fix:turkish         # Fix Turkish character encoding issues
npm run fix:turkish:check   # Check only, no fix
```

To run a single test file:
```bash
npx vitest run src/utils/classification.test.ts
```

## Architecture: Vertical Slice (Feature-First)

The codebase is organized into **17 independent feature modules** under `src/features/`. Each feature is fully self-contained with its own `components/`, `hooks/`, `services/`, `types`, and a public `index.ts` barrel.

**Features:** `astronomy`, `basemap`, `clustering`, `data-management`, `data-mapper`, `geocoder`, `globe-view`, `heatmap`, `layers`, `legend`, `map`, `spatial-analysis`, `storymap-modal`, `timeline`, `visualization`, `viz-wizard`

### Import Boundaries (ESLint-enforced)

1. **Cross-feature imports are forbidden.** Features may only import from `@/shared/`, `@/stores/`, `@/utils/`, `@/types/`, or `@/constants/`. They must never import `@/features/<other-feature>`.
2. **No deep imports.** Consumers (including root orchestrators) must use the feature's public barrel: `@/features/<name>` — never `@/features/<name>/components/Foo`.
3. **Root orchestration is centered in `AppLayout.tsx`.** `Sidebar.tsx` is a sectional orchestrator. `MapContainer` and its direct collaborators (`DataLayer`, `GISToolsControl`, `GISToolsControl.buffer`, `GISToolsControl.bufferOptions`) are **map-level orchestrators** — they compose `data-management` and `elevation-profile` onto the canvas and are ESLint-whitelisted to use `@/features/<name>` barrel imports.
4. **`src/components/` (global UI)** may not import from `src/features/`.

### Application Flow

```
index.html → main.tsx → App.tsx (MapProvider + Toaster)
  → AppLayout.tsx  ← single root orchestrator
      → Sidebar.tsx            ← sidebar-level composition
      → MapContainer           ← map-domain composition / mount point
          → DataManagementDrawTool
          → ElevationProfileTool
          → DataLayer → VisualizationManager
              → ChoroplethRenderer | BubbleRenderer | PointRenderer
```

### Global State (Zustand stores in `src/stores/`)

| Store | Purpose |
|---|---|
| `useMapStore` | MapLibre instance, basemap, zoom/center |
| `useVisualizationStore` | Viz wizard steps, column mapping, GeoJSON cache, color config |
| `useDataManagementStore` | Imported data items (IndexedDB persist) |
| `useDataStore` | Shared data access |
| `useClusteringStore` | Clustering state |
| `useToolStore` | Active GIS tool |
| `useTimelineStore` | Timeline state |
| `useStorymapModalStore` | Storymap modal state |

### Shared Utilities (`src/shared/` and `src/utils/`)

Reusable, feature-agnostic code lives in `src/utils/` (classification, interpolation, map expressions, geometry, Turkish normalization, etc.) and `src/shared/` (analytics, legend, visualization helpers, column mapper).

## Performance Patterns

Two critical patterns reduce INP to ~16ms:

1. **`startTransition`** — Heavy state updates are wrapped so they don't block user interactions.
2. **GPU-side style updates** — `useLayerStyleSync` calls MapLibre `setPaintProperty`/`setLayoutProperty` directly instead of rebuilding GeoJSON. `useVizRender` distinguishes paint-only updates from full re-renders.

## Git Commit Messages

- **Always write in Turkish** — commit messages must be in Turkish at all times.

## Code Style (enforced by ESLint)

- **No semicolons** (`@stylistic/semi: never`)
- **Single quotes** for strings
- **2-space indentation**
- **Trailing commas** in multiline
- **`import type`** for type-only imports (`@typescript-eslint/consistent-type-imports`)
- **No `any`** (`@typescript-eslint/no-explicit-any: error`)
- Import order: builtin → external → `@/` internal → parent/sibling → index (alphabetical within groups)
- Max 600 lines per file, 500 lines per function (warnings)

## Adding a New Feature

Create the folder structure directly — do not ask for confirmation:
```
src/features/<name>/
  components/
  hooks/
  services/      # or utils/
  index.ts       # public API barrel
```

## Path Alias

`@/` resolves to `src/`. Configured in both `vite.config.ts` and `vitest.config.ts`.

## Build Output

Vite splits chunks into: `react-vendor`, `map-vendor`, `data-vendor`, `ui-vendor`, `utils-vendor`, plus lazy feature chunks for `astronomy`, `viz-wizard`, and `data-import`.

## Storymap

A static mini-app lives in `storymap/`. During dev, it is served at `/cbs-react/storymap/` via the `serveStorymap` Vite plugin.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes -- don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -- then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. Plan First: Write plan to tasks/todo.md with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review section to tasks/todo.md
6. Capture Lessons: Update tasks/lessons.md after corrections

## Core Principles

- Simplicity First: Make every change as simple as possible. Impact minimal code.
- No Laziness: Find root causes. No temporary fixes. Senior developer standards.
- Minimal Impact: Only touch what's necessary. No side effects with new bugs.
