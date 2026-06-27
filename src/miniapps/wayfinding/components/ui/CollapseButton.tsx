"use client";

export function CollapseButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? "ย่อ" : "ขยาย"}
      title={open ? "ย่อ" : "ขยาย"}
      className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--line)] bg-white/60 text-[#5b6675] transition-all hover:bg-white hover:text-[#e0732f] active:scale-95"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: open ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}
