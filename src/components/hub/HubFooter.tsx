import Link from "next/link";
import { COPYRIGHT_LINE } from "@/lib/license";

const LEGAL_LINKS = [
  { href: "/privacy", label: "นโยบายความเป็นส่วนตัว" },
  { href: "/license", label: "ลิขสิทธิ์" },
] as const;

export function HubFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`pointer-events-auto ${className}`}
      aria-label="ส่วนท้ายและเอกสารทางกฎหมาย"
    >
      <div className="glass flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-[11px] leading-relaxed text-[#8893a3]">
          {COPYRIGHT_LINE}
        </p>
        <nav
          aria-label="เอกสารทางกฎหมาย"
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-medium text-[#5b6675] transition-colors hover:text-[#2f6df0]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
