import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NKP Shuttle Sim — รพ.นครพิงค์",
  description:
    "การจำลอง 3 มิติ มุมมอง bird's eye ของเส้นทางรถ shuttle รับส่งลานจอดรอบโรงพยาบาลนครพิงค์",
};

export default function ShuttleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
