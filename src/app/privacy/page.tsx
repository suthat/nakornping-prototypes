import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/hub/LegalDocumentPage";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว — NKP Simulation Hub",
  description:
    "นโยบายความเป็นส่วนตัวของศูนย์รวมการจำลอง 3 มิติ โรงพยาบาลนครพิงค์",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="นโยบายความเป็นส่วนตัว"
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
