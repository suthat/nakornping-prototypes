type SceneLoadingOverlayProps = {
  label: string;
  visible?: boolean;
};

export function SceneLoadingOverlay({
  label,
  visible = true,
}: SceneLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="absolute inset-0 z-10 flex items-center justify-center bg-[#eef1f5]"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-[#c5ceda] border-t-[#2f6df0]"
          aria-hidden="true"
        />
        <p className="text-[13px] font-medium text-[#5b6675]">{label}</p>
      </div>
    </div>
  );
}

export const SCENE_LOADING_LABELS = {
  hub: "กำลังโหลดเมนู 3 มิติ…",
  simulation: "กำลังโหลดฉากจำลอง 3 มิติ…",
} as const;
