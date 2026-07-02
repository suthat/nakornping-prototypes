import { getConsoleFunction, setConsoleFunction } from "three";

/**
 * R3F 9.x still constructs THREE.Clock; three r183+ warns on every construction.
 * ESM namespace exports are read-only, so we filter known upstream deprecations
 * via three's console hook until R3F v10 stable ships.
 */
const SUPPRESSED_WARNINGS = new Set([
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.",
  "THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.",
]);

const patched = Symbol.for("nkp.threeDeprecationCompat");

type ConsoleFn = (
  type: "log" | "warn" | "error",
  message: string,
  ...params: unknown[]
) => void;

function forwardConsole(
  type: "log" | "warn" | "error",
  message: string,
  ...params: unknown[]
) {
  switch (type) {
    case "log":
      console.log(message, ...params);
      break;
    case "warn":
      console.warn(message, ...params);
      break;
    case "error":
      console.error(message, ...params);
      break;
  }
}

if (!(globalThis as Record<symbol, boolean>)[patched]) {
  const previous = getConsoleFunction() as ConsoleFn | null;

  setConsoleFunction((type, message, ...params) => {
    if (type === "warn" && SUPPRESSED_WARNINGS.has(message)) {
      return;
    }

    if (previous) {
      previous(type, message, ...params);
      return;
    }

    forwardConsole(type, message, ...params);
  });

  (globalThis as Record<symbol, boolean>)[patched] = true;
}
