@AGENTS.md

# NKP Sim — project notes for agents

## What this repo is

A collection of **3D mini simulations** for Nakornping Hospital (รพ.นครพิงค์), Chiang Mai.
Stack: Next.js 16 · React 19 · TypeScript · Tailwind v4 · three.js · @react-three/fiber · drei · zustand.

Each mini app lives in `src/miniapps/<id>/` and has its own route under `src/app/<id>/`.
The hub at `/` auto-generates tiles from `src/lib/miniapps.ts` — register a new app there to surface it.

## Mini apps

| id | route | description |
|----|-------|-------------|
| `shuttle` | `/shuttle` | Shuttle bus simulation — Poisson arrivals, Catmull-Rom curves, waiting-time algorithm |
| `tb-airborne` | `/tb-airborne` | Airborne TB transmission simulation |
| `wayfinding` | `/wayfinding` | Hospital wayfinding — human traffic, confusion hotspots, nav solution comparison |

## Key conventions

- **Simulation engines** are plain TypeScript classes in `lib/simulation.ts`, stepped by a `useFrame` hook in `SimDriver.tsx`. No React state inside the engine.
- **Store** (`lib/store.ts`) is zustand. Snapshots flow from the engine → store → components each frame.
- **Layout / graph** (`lib/layout.ts`) defines static geometry — nodes, edges, adjacency. Do not put dynamic sim state here.
- **Types** (`lib/types.ts`) owns all shared interfaces, enums, and constants (`DEFAULT_CONFIG`, `NAV_SOLUTION_META`, etc.).
- UI panels live under `components/ui/`, 3D world objects under `components/world/`.
- Tailwind v4 only — no `tailwind.config.js`, classes are `@utility` / `@layer` in `globals.css`.
- Thai-language strings are fine and expected in comments and labels throughout.

## Adding a new mini app

1. `src/miniapps/<id>/` — copy structure from an existing app.
2. `src/app/<id>/page.tsx` — minimal route file that renders the app's `index.tsx`.
3. `src/lib/miniapps.ts` — add an entry to `MINI_APPS` and extend `MiniAppIcon`.
