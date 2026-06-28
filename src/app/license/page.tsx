import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/hub/LegalDocumentPage";
import {
  LICENSE_ATTRIBUTION_EXAMPLE,
  LICENSE_INTRO,
  LICENSE_SECTIONS,
} from "@/lib/license";

export const metadata: Metadata = {
  title: "ลิขสิทธิ์และเงื่อนไขการใช้งาน — NKP Simulation Hub",
  description:
    "ลิขสิทธิ์และเงื่อนไขการใช้งาน NKP Mini Simulation Projects โรงพยาบาลนครพิงค์",
};

export default function LicensePage() {
  return (
    <LegalDocumentPage
      title="ลิขสิทธิ์และเงื่อนไขการใช้งาน"
      intro={LICENSE_INTRO}
      sections={LICENSE_SECTIONS}
    >
      <section className="mt-5">
        <h2 className="text-[13px] font-semibold text-[#1c2530]">
          ตัวอย่างการระบุที่มา
        </h2>
        <p className="mt-2 rounded-xl border border-[#2f6df0]/15 bg-[#2f6df0]/5 px-3 py-2.5 text-[11.5px] leading-relaxed text-[#3d4d61]">
          “{LICENSE_ATTRIBUTION_EXAMPLE}”
        </p>
      </section>
    </LegalDocumentPage>
  );
}
