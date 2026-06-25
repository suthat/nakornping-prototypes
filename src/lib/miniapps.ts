export type MiniAppIcon = "shuttle" | "tb-airborne";

export interface MiniAppEntry {
  id: string;
  title: string;
  description: string;
  href: string;
  color: string;
  icon: MiniAppIcon;
}

/** mini app ที่มี route และพร้อมใช้งานจริงเท่านั้น */
export const MINI_APPS: MiniAppEntry[] = [
  {
    id: "shuttle",
    title: "NKP Shuttle",
    description: "จำลองรถรับส่งลานจอด รพ.นครพิงค์",
    href: "/shuttle",
    color: "#2f6df0",
    icon: "shuttle",
  },
  {
    id: "tb-airborne",
    title: "TB Airborne",
    description: "จำลองการแพร่เชื้อทางอากาศ คลินิกวัณโรค",
    href: "/tb-airborne",
    color: "#059669",
    icon: "tb-airborne",
  },
];

/** ระยะห่างระหว่างแผ่นเมนู (หน่วย 3D) — คำนวณจากจำนวน app */
export const HUB_TILE_SPACING = 5.2;

export function layoutMiniApps(apps: MiniAppEntry[]) {
  return apps.map((app, i) => {
    const x = (i - (apps.length - 1) / 2) * HUB_TILE_SPACING;
    return { app, position: [x, 0, 0] as [number, number, number] };
  });
}

export function hubPlatformSize(appCount: number) {
  const width = Math.max(8, appCount * HUB_TILE_SPACING + 3.5);
  return { width, depth: 5.5 };
}
