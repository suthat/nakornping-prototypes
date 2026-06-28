import Link from "next/link";
import { HubFooter } from "@/components/hub/HubFooter";
import {
  LegalDocumentBody,
  type LegalSection,
} from "@/components/hub/LegalDocumentBody";

export function LegalDocumentPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro: string;
  sections: readonly LegalSection[];
  children?: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-y-auto">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(900px 600px at 50% 0%, rgba(47,109,240,0.08) 0%, transparent 60%), linear-gradient(160deg, #f3f5f9 0%, #e7ebf1 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-6 p-4 sm:p-6">
        <article className="glass fade-up rounded-3xl px-5 py-5 sm:px-7 sm:py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b6675] transition-colors hover:text-[#2f6df0]"
          >
            <span aria-hidden>←</span>
            กลับศูนย์รวมการจำลอง
          </Link>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8893a3]">
            NKP Simulation
          </p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tightish text-[#1c2530] sm:text-[22px]">
            {title}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5b6675]">
            {intro}
          </p>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/45 px-4 py-4 sm:px-5">
            <LegalDocumentBody sections={sections}>{children}</LegalDocumentBody>
          </div>
        </article>

        <HubFooter />
      </div>
    </div>
  );
}
