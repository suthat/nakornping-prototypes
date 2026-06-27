import * as THREE from "three";
import { LifeActivity, PersonKind } from "./types";

/** สีตามประเภทคน */
export const KIND_HEX: Record<PersonKind, string> = {
  appointment: "#2f6df0",
  walkin: "#38bdf8",
  emergency: "#ec5b54",
  caregiver: "#a78bfa",
  elder: "#f0a341",
  staff: "#22a06b",
  vendor: "#94a3b8",
};

export const KIND_LABEL: Record<PersonKind, string> = {
  appointment: "ผู้ป่วยนัด",
  walkin: "ผู้ป่วย walk-in",
  emergency: "ฉุกเฉิน",
  caregiver: "ญาติ/ผู้ดูแล",
  elder: "ผู้สูงอายุ",
  staff: "เจ้าหน้าที่",
  vendor: "แม่ค้า/ส่งของ",
};

/** สีตามกิจกรรมชีวิต */
export const ACTIVITY_HEX: Record<LifeActivity, string> = {
  transit: "#7ea2e8",
  queue: "#f0a341",
  service: "#5b8cf0",
  restroom: "#38bdf8",
  eating: "#f59e0b",
  shopping: "#22c55e",
  parking: "#94a3b8",
  resting: "#34d399",
  asking: "#a78bfa",
  lost: "#ec5b54",
  leaving: "#cbd5e1",
  idle: "#b9c6da",
};

export const ACTIVITY_LABEL: Record<LifeActivity, string> = {
  transit: "เดิน",
  queue: "ต่อคิว",
  service: "รับบริการ",
  restroom: "ห้องน้ำ",
  eating: "กินข้าว",
  shopping: "7-11",
  parking: "หาที่จอด",
  resting: "นั่งพัก",
  asking: "ถามทาง",
  lost: "หลงทาง",
  leaving: "กลับบ้าน",
  idle: "หยุดรอ",
};

const COOL = new THREE.Color("#7ea2e8");
const WARM = new THREE.Color("#f0a341");
const HOT = new THREE.Color("#ec5b54");

/** สีตามระดับ distress 0..1 (เย็น→อุ่น→ร้อน) */
export function distressColor(d: number, target = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(d, 0, 1);
  if (t < 0.5) return target.copy(COOL).lerp(WARM, t / 0.5);
  return target.copy(WARM).lerp(HOT, (t - 0.5) / 0.5);
}

const HEAT_LO = new THREE.Color("#5fbf8f");
const HEAT_MID = new THREE.Color("#f0a341");
const HEAT_HI = new THREE.Color("#ec5b54");

/** สี heatmap ความสับสน 0..1 */
export function heatColor(h: number, target = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(h, 0, 1);
  if (t < 0.5) return target.copy(HEAT_LO).lerp(HEAT_MID, t / 0.5);
  return target.copy(HEAT_MID).lerp(HEAT_HI, (t - 0.5) / 0.5);
}

export function kindColor(kind: PersonKind, target = new THREE.Color()): THREE.Color {
  return target.set(KIND_HEX[kind]);
}

export function activityColor(act: LifeActivity, target = new THREE.Color()): THREE.Color {
  return target.set(ACTIVITY_HEX[act]);
}
