import * as THREE from "three";
import type { LifeActivity, PersonKind } from "./types";

const SAFE = new THREE.Color("#22a06b");
const NON_ACTIVE = new THREE.Color("#14b8a6");
const FAMILY = new THREE.Color("#5b8cf0");
const EXPOSED = new THREE.Color("#f0a341");
const INFECTED = new THREE.Color("#ec5b54");
const ACTIVE = new THREE.Color("#9333ea");
const VISITOR = new THREE.Color("#8893a3");

/** สีตามสถานะสุขภาพ */
export function healthColor(
  status: "susceptible" | "exposed" | "infected",
  kind: "active" | "non_active" | "family" | "visitor",
  target = new THREE.Color()
): THREE.Color {
  if (kind === "active") return target.copy(ACTIVE);
  if (kind === "non_active") {
    if (status === "infected") return target.copy(INFECTED);
    if (status === "exposed") return target.copy(EXPOSED);
    return target.copy(NON_ACTIVE);
  }
  if (kind === "family") {
    if (status === "infected") return target.copy(INFECTED);
    if (status === "exposed") return target.copy(EXPOSED);
    return target.copy(FAMILY);
  }
  if (kind === "visitor") {
    if (status === "infected") return target.copy(INFECTED);
    if (status === "exposed") return target.copy(EXPOSED);
    return target.copy(VISITOR);
  }
  if (status === "infected") return target.copy(INFECTED);
  if (status === "exposed") return target.copy(EXPOSED);
  return target.copy(SAFE);
}

/** สีความเสี่ยง quanta 0..1+ → เขียว→เหลือง→แดง */
export function riskColor(level: number, target = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(level, 0, 1.2) / 1.2;
  const low = new THREE.Color("#22a06b");
  const mid = new THREE.Color("#f0a341");
  const high = new THREE.Color("#ec5b54");
  if (t < 0.45) return target.copy(low).lerp(mid, t / 0.45);
  return target.copy(mid).lerp(high, (t - 0.45) / 0.55);
}

/** สี exposure dose */
export function exposureColor(dose: number, target = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(dose / 2.5, 0, 1);
  return target.copy(new THREE.Color("#eef3ff")).lerp(new THREE.Color("#ec5b54"), t);
}

const ACTIVITY = {
  transit: "#2f6df0",
  eating: "#f0a341",
  restroom: "#38bdf8",
  pharmacy: "#7c3aed",
  paying: "#eab308",
  waiting: "#8893a3",
  opd: "#2f6df0",
  leaving: "#64748b",
  idle: "#8893a3",
} as const;

/** สีตามกิจกรรมชีวิต — ช่วยมองเห็นการเดินไปกินข้าว/ห้องน้ำ */
export function activityColor(
  activity: LifeActivity,
  kind: PersonKind,
  target = new THREE.Color()
): THREE.Color {
  const base = ACTIVITY[activity] ?? ACTIVITY.idle;
  target.set(base);
  if (kind === "visitor") target.lerp(new THREE.Color("#ffffff"), 0.15);
  return target;
}
