# Project Architecture Rules

This project strictly follows **Vertical Slice Architecture** within a **Feature-First** structure.

## Core Principles
1.  **Vertical Slicing:** Every feature must be self-contained.
    -   Do NOT group by technical layer (e.g., no global `src/services/renderers`).
    -   Group by business domain (e.g., `src/features/visualization/bubble/`).

2.  **Co-location:** A feature folder must contain EVERYTHING it needs:
    -   `components/` (UI)
    -   `hooks/` (Logic)
    -   `services/` or `utils/` (Business Logic/Renderers)
    -   `index.ts` (Public API)

3.  **Public API:** Features should only communicate via their `index.ts` file. Deep imports (e.g., `import X from 'features/map/components/X'`) are forbidden.

4.  **New Features:** When I ask for a new feature, automatically create this folder structure under `src/features/` without asking.