---
trigger: always_on
---

---
trigger: always_on
---

# Project Architecture: Vertical Slice & Feature-First

**Core Philosophy:** This project uses a **Vertical Slice Architecture**. We organize code by **Business Domain (Feature)**, not by technical layer.

## 🏗️ Folder Structure Rules

### 1. The "Features" Directory (`src/features/`)
This is where 90% of the application code lives.
* **Concept:** A feature is a self-contained module that delivers specific business value.
* **Rule:** Everything related to a feature (UI, Logic, API, Styles) must be **co-located** inside that feature's folder.

### 2. Vertical Slicing for Visualization (CRITICAL)
We distinguish between the **"Wizard"** (Configuration Flow) and the **"Engine"** (Rendering Logic).

* **❌ OLD (Monolith):** `src/features/viz-wizard` handling everything.
* **✅ NEW (Vertical Slices):**
    * `src/features/viz-wizard/` → Only handles the UI steps (Stepper, Sidebar).
    * `src/features/visualization/bubble/` → **Vertical Slice** for Bubble Maps (Settings UI + Renderer + Hooks).
    * `src/features/visualization/choropleth/` → **Vertical Slice** for Choropleth Maps.
    * `src/features/visualization/point/` → **Vertical Slice** for Dot Density/Point Maps.

### 3. The "Components" Directory (`src/components/`)
* **Strictly for:** Generic, domain-agnostic UI elements (Buttons, Inputs, Modals, Layouts).
* **Forbidden:** Do NOT put business logic or feature-specific complex components here.
    * *Bad:* `src/components/visualization/Legend.tsx`
    * *Good:* `src/features/legend/components/Legend.tsx`

---

## 🗺️ Feature Map (Where does code go?)

| Domain | Folder Path | Description |
| :--- | :--- | :--- |
| **Viz Engine** | `src/features/visualization/[type]/` | Renderers, calculation logic, specific settings UI. |
| **Viz Wizard** | `src/features/viz-wizard/` | The step-by-step UI flow (Step 1, Step 2...). |
| **Map** | `src/features/map/` | Core map container, basemaps, zoom controls. |
| **Legend** | `src/features/legend/` | Legend rendering logic and UI (Datawrapper style). |
| **Data** | `src/features/data-import/` | File upload, parsing, column mapping. |
| **Shared UI** | `src/components/ui/` | Shadcn UI, atomic components. |

---

## 🚫 Strict Constraints

1.  **No Cross-Feature Deep Imports:**
    * ❌ `import { X } from '@/features/map/components/Internal'`
    * ✅ `import { MapContainer } from '@/features/map'` (Always use `index.ts` public API).

2.  **No "Service" Monoliths:**
    * ❌ `src/services/renderers/BubbleRenderer.ts`
    * ✅ `src/features/visualization/bubble/services/Renderer.ts`

3.  **Barrel Exports:**
    * Every feature folder MUST have an `index.ts` exporting only what is necessary for other features.

4.  **Limits:**
    * If a file exceeds 300 lines, extract sub-components or hooks within the same feature folder.

---

## 🤖 AI Instruction for New Features
When asked to add a new visualization type (e.g., Heatmap):
1.  Create `src/features/visualization/heatmap/`.
2.  Add `components/Settings.tsx`, `services/Renderer.ts`, `hooks/useHeatmap.ts`.
3.  Export via `index.ts`.
4.  Do NOT touch `viz-wizard` logic unless connecting the new slice.