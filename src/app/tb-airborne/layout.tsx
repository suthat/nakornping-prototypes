import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TB Airborne Sim — รพ.นครพิงค์",
  description:
    "การจำลอง 3 มิติ การแพร่เชื้อทางอากาศจากคลินิกวัณโรค รพ.นครพิงค์ แบบ Wells-Riley compartment model",
};

export default function TbAirborneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
