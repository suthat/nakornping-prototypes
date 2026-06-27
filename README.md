# NKP Mini Simulation Projects — Nakornping Hospital

A growing collection of small, focused **3D simulations** for Nakornping Hospital,
presented in a clean, architect-style white theme. The app opens on a 3D **hub** from
which you can launch each mini simulation. The hub is designed to scale — new
simulations can be added over time without changing the overall experience.

## Mini Apps

| App | Route | Description |
|-----|-------|-------------|
| **NKP Shuttle** | `/shuttle` | Shuttle bus simulation between the hospital and the outer parking lots, with a waiting-time algorithm |
| **TB Airborne** | `/tb-airborne` | Airborne transmission simulation for the tuberculosis clinic |
| **NKP Wayfinding** | `/wayfinding` | Hospital wayfinding simulation — human traffic flows, confusion hotspots, and nav solution comparison |

> The list of available apps is registered in `src/lib/miniapps.ts`. The hub layout is
> generated automatically from this registry, so adding a new entry surfaces it on the hub.

## Featured: NKP Shuttle

A **bird's eye view** simulation of the shuttle bus route carrying passengers between
Nakornping Hospital and the outer parking lots, with a **waiting time** algorithm based
on real mass-transit principles.

- **3D scene** in a minimal white theme — hospital building, parking lots P1–P3, the loop road, and bus stops with blinking markers
- **Shuttle buses** that move smoothly along Catmull-Rom curves with a passenger-count bar
- **Waiting people** rendered as groups, color-coded by waiting time (blue → orange → red)
- **Weather**: clear / drizzle / heavy rain — rain increases passenger arrivals, slows the buses, lengthens boarding time, and crowds people under shelter and into the building
- **Config panel** with live tuning: number of buses, seats/standing capacity, speed, dwell time, passenger arrival rate, and simulation speed
- **Real-time stats panel**: average/P90/maximum waiting time, headway, system load factor, left-behind passengers, and throughput

### Waiting Time Algorithm

Based on mass-transit principles (`src/miniapps/shuttle/lib/simulation.ts`):

- **Passenger arrival** — a Poisson process distributed by each stop's demand weight
- **Cycle time** = loop distance / speed + dwell time at every stop
- **Headway** `H` = cycle / number of buses → theoretical average waiting time ≈ `H/2`
- **Capacity & overload** — when demand > capacity, the system saturates and queues and waiting times spike (with a "left-behind passengers" count)
- Compares the **theoretical** values against the **empirical** values measured from the live simulation every frame

## Featured: NKP Wayfinding

A **top-down 3D simulation** of patient and visitor movement inside Nakornping Hospital,
modelling three interacting systems:

1. **Human traffic** — seven visitor archetypes (appointment patient, walk-in, emergency, caregiver, elder, staff, vendor), each with unique familiarity, literacy, walking speed, and digital capability. Arrivals follow a time-of-day demand curve with configurable peaks.
2. **Confusion & getting lost** — agents make wrong-turn decisions at decision nodes based on signage quality, junction complexity, floor confusion, crowd blindness, and personal state (stress, fatigue, confusion). Lost trails are rendered in the scene and confusion hotspots are highlighted.
3. **Navigation solutions** — seven interventions can be toggled and compared live:

| Solution | Cost | Description |
|----------|------|-------------|
| Floor colour path | ★☆☆☆☆ | Coloured lines on the floor per department |
| Landmark signs | ★★☆☆☆ | Signs anchored to visible landmarks (7-11, fountain, building colour) |
| Point-to-point mini-map | ★☆☆☆☆ | Short-leg map with landmark callouts — cheapest intervention |
| Volunteer guides | ★★☆☆☆ | Human-in-the-loop volunteers at decision junctions |
| QR / Kiosk | ★★★★☆ | Digital turn-by-turn on the patient's phone via QR scan |
| iBeacon + LINE | ★★★★☆ | Proactive push navigation via hospital LINE account + iBeacons |
| Queue-aware routing | ★★★★★ | Reroutes agents around congested service nodes in real time |

**Key metrics**: lost-now count, first-try navigation success rate, average detour distance, confusion cause breakdown (sequence / building / floor / department / signage), hotspot nodes, cost index vs. effectiveness score.

`src/miniapps/wayfinding/lib/simulation.ts` — simulation engine
`src/miniapps/wayfinding/lib/layout.ts` — hospital node graph & shortest-path

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · three.js · @react-three/fiber · drei · zustand

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Project Structure

```
src/
  app/                 # Next.js routes (hub at /, plus one route per mini app)
    page.tsx           # 3D hub landing page
    shuttle/           # /shuttle route
    tb-airborne/       # /tb-airborne route
  lib/
    miniapps.ts        # registry of available mini apps + hub layout helpers
  components/
    hub/               # HubApp, HubScene, MiniAppTile (the 3D launcher)
  miniapps/
    shuttle/           # Shuttle simulation (lib + components)
    tb-airborne/       # TB airborne simulation (lib + components)
    wayfinding/        # Wayfinding simulation (lib + components)
```

Each mini app under `src/miniapps/<id>/` is self-contained, typically with:

```
miniapps/<id>/
  index.tsx            # entry component
  lib/                 # simulation engine, layout, store, providers, types
  components/
    Scene.tsx          # Canvas, lighting, camera, controls
    world/             # 3D world objects
    ui/                # panels and overlays
```

## Adding a New Mini App

1. Create a new folder under `src/miniapps/<id>/` following the structure above.
2. Add a route under `src/app/<id>/`.
3. Register the app in `src/lib/miniapps.ts` so it appears on the hub.

## License

This project is released under an open license that requires attribution back to the
**Leadership Bootcamp 4 (2026)** project. Usage and development rights belong to
**Nakornping Hospital, Chiang Mai, Thailand**. Initiated by **DO IN THAI Company Limited**.

See [LICENSE](./LICENSE) for the full terms.
