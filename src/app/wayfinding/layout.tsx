import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NKP Wayfinding & Human Traffic — รพ.นครพิงค์",
  description:
    "การจำลอง 3 มิติของกระแสคน การหลงทาง และทางออกการนำทางในโรงพยาบาลนครพิงค์ — ชีวิตคนใน รพ. ไม่ใช่แค่ A→B",
};

export default function WayfindingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
