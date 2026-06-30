"use client";

import { useEffect } from "react";

type SceneReadyMarkerProps = {
  onReady: () => void;
};

/** อยู่ท้าย Suspense — mount เมื่อ asset ใน boundary โหลดครบแล้ว */
export function SceneReadyMarker({ onReady }: SceneReadyMarkerProps) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return null;
}
