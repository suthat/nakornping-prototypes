import * as THREE from "three";

const COOL = new THREE.Color("#7ea2e8"); // รอสั้น (ฟ้าอ่อน ให้เด่นบนพื้นขาว)
const WARM = new THREE.Color("#f0a341"); // รอปานกลาง
const HOT = new THREE.Color("#ec5b54"); // รอนาน
const WHITE = new THREE.Color("#eef3ff");

/**
 * แม็ปเวลารอ (วินาที) → สี
 * 0s = ฟ้าเย็น, ~90s = อุ่น, >=180s = ร้อน
 */
export function waitColor(seconds: number, target = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(seconds / 180, 0, 1);
  if (t < 0.5) {
    return target.copy(COOL).lerp(WARM, t / 0.5);
  }
  return target.copy(WARM).lerp(HOT, (t - 0.5) / 0.5);
}

/** สีตามภาระรถ (load = onboard/seats) ขาว→อุ่น→ร้อนเมื่อแน่น */
export function loadColor(load: number, target = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(load, 0, 1.6) / 1.6;
  if (t < 0.6) {
    return target.copy(WHITE).lerp(WARM, t / 0.6);
  }
  return target.copy(WARM).lerp(HOT, (t - 0.6) / 0.4);
}
