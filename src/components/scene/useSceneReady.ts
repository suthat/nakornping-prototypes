"use client";

import { useCallback, useState } from "react";

export function useSceneReady() {
  const [glReady, setGlReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const ready = glReady && sceneReady;

  const onGlCreated = useCallback(() => {
    setGlReady(true);
  }, []);

  const onSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  return { ready, onGlCreated, onSceneReady };
}
