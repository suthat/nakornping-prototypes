export type WeatherKind = "clear" | "rain" | "storm";

export interface WeatherProfile {
  rainLevel: number;
  /** ตัวคูณผู้มาเยือน (ฝนตก คนน้อยลง) */
  crowdMult: number;
  /** ตัวคูณการเดินทางกลางแจ้ง */
  outdoorMoveMult: number;
  /** ตัวคูณการระบายอากาศกลางแจ้ง (ฝนช่วยพัดกระจาย) */
  outdoorVentMult: number;
  label: string;
}

export const WEATHER: Record<WeatherKind, WeatherProfile> = {
  clear: {
    rainLevel: 0,
    crowdMult: 1,
    outdoorMoveMult: 1,
    outdoorVentMult: 1,
    label: "แจ่มใส",
  },
  rain: {
    rainLevel: 0.55,
    crowdMult: 0.72,
    outdoorMoveMult: 0.55,
    outdoorVentMult: 1.35,
    label: "ฝนปรอย",
  },
  storm: {
    rainLevel: 1,
    crowdMult: 0.55,
    outdoorMoveMult: 0.35,
    outdoorVentMult: 1.6,
    label: "ฝนตกหนัก",
  },
};

/** โหมดการจำลองหลัก (นโยบายผู้ป่วย active ที่ทราบสถานะแล้ว) */
export type ScenarioKind =
  | "active_move" // รู้ว่า active + เคลื่อนที่ไปห้องยา/การเงิน
  | "active_no_move" // รู้ว่า active + ไม่เคลื่อนที่
  | "fast_track"; // คัดกรอง fast track → TB แล้ว no movement

export type ZoningMode = "none" | "zoned";

export type PersonKind = "active" | "non_active" | "family" | "visitor";

export type HealthStatus = "susceptible" | "exposed" | "infected";

/** กิจกรรมชีวิตใน รพ. */
export type LifeActivity =
  | "idle"
  | "transit"
  | "eating"
  | "restroom"
  | "pharmacy"
  | "paying"
  | "waiting"
  | "opd"
  | "leaving";

export interface SimConfig {
  scenario: ScenarioKind;
  zoning: ZoningMode;
  weather: WeatherKind;
  /** จำลองช่วงเวลาในวัน (เช้า/เที่ยง) */
  timeOfDay: boolean;
  /** จำนวนผู้ป่วย active ที่ทราบสถานะ */
  numActive: number;
  /** จำนวนผู้ป่วย non-active ในคลินิก TB */
  numNonActive: number;
  /** จำนวนญาติ/ผู้ติดตาม */
  numFamily: number;
  /** อัตราผู้มาเยือนทั่วไป (คน/ชม.) */
  visitorRate: number;
  /** จำนวนคนในฉากสูงสุด (รวมทุกประเภท) */
  maxCrowd: number;
  /** กระแสผู้ป่วย OPD ทั่วไป (คน/ชม.) — ไม่เข้าเส้นทาง TB */
  opdGeneralRate: number;
  /** เปิดเส้นทาง OPD → คัดกรอง/IDEN → TB (ผสมกับทุก scenario ได้) */
  opdScreening: boolean;
  /** อัตราผู้มา OPD เพื่อคัดกรอง (คน/ชม.) */
  opdArrivalRate: number;
  /** สัดส่วนผู้มา OPD ที่เป็น active แต่ยังไม่ทราบ (แพร่เชื้อที่ OPD ก่อน IDEN) */
  unknownActiveRatio: number;
  /** อัตราปล่อย quanta ของผู้ป่วย active (quanta/ชม.) — Wells-Riley */
  quantaRate: number;
  /** ความไวต่อการติดเชื้อ (1 = ปกติ) */
  susceptibility: number;
  /** ตัวคูณความเร็วจำลอง */
  simSpeed: number;
  /** เปิดการเดินทางไปโรงอาหารช่วงเที่ยง */
  lunchMovement: boolean;
  /** คนเดินทั่วไปใน รพ. (spawn + เดินไปมา) */
  ambientCrowd: boolean;
}

export const DEFAULT_CONFIG: SimConfig = {
  scenario: "active_move",
  zoning: "zoned",
  weather: "clear",
  timeOfDay: true,
  numActive: 8,
  numNonActive: 48,
  numFamily: 24,
  visitorRate: 140,
  maxCrowd: 720,
  opdGeneralRate: 220,
  opdScreening: false,
  opdArrivalRate: 55,
  unknownActiveRatio: 0.08,
  quantaRate: 3.5,
  susceptibility: 1,
  simSpeed: 4,
  lunchMovement: true,
  ambientCrowd: true,
};

export type ScreeningStage = "none" | "waiting_iden" | "iden_done" | "to_tb";

export interface AgentSnapshot {
  id: number;
  kind: PersonKind;
  status: HealthStatus;
  zoneId: number;
  /** 0..1 ระหว่างเดินทาง */
  moveT: number;
  fromZone: number;
  toZone: number | null;
  /** ตำแหน่ง [x,z] สำหรับ render */
  position: [number, number];
  exposure: number;
  identified: boolean;
  /** มาเส้นทาง OPD ก่อนส่ง TB */
  viaOpd: boolean;
  /** กำลังเดินทางระหว่างโซน */
  inTransit: boolean;
  /** กิจกรรมปัจจุบัน */
  activity: LifeActivity;
  /** ขั้นตอน OPD screening (เมื่อ viaOpd) */
  screeningStage: ScreeningStage;
}

export interface ZoneSnapshot {
  id: number;
  occupants: number;
  infectious: number;
  /** ความเข้ม quanta ในอากาศ (normalized 0..1+) */
  quantaConc: number;
  /** ความเสี่ยงสะสมในช่วง 60 วินาทีล่าสุด */
  riskIndex: number;
  newInfections: number;
}

export interface SimStats {
  simTime: number;
  dayMinutes: number;
  crowdFactor: number;
  periodLabel: string;
  totalAgents: number;
  susceptible: number;
  exposed: number;
  infected: number;
  /** การติดเชื้อใหม่ในช่วง 2 ชม. โรงพยาบาลล่าสุด */
  newInfectionsRate: number;
  /** โซนที่เสี่ยงสูงสุด */
  peakZoneId: number;
  peakRisk: number;
  /** การติดเชื้อในคลินิก TB vs นอกคลินิก */
  infectedInClinic: number;
  infectedOutside: number;
  /** การติดเชื้อจากการเดินทาง (transit) */
  transitInfections: number;
  /** ค่าเฉลี่ย exposure dose */
  avgExposure: number;
  /** จำนวนครั้งที่ active เคลื่อนที่ข้ามโซน */
  activeCrossings: number;
  /** ผู้ติดเชื้อรองที่ยังอยู่ใน รพ. (ไม่รวมที่กำลังออก) */
  secondaryInfected: number;
  /** กำลังออกจาก รพ. / กลับบ้าน */
  leavingHospital: number;
  /** ผู้รอคัดกรองที่ OPD (ยังไม่ IDEN) */
  waitingAtOpd: number;
  /** active ที่ซ่อนอยู่ที่ OPD (ยังไม่ทราบตัว) */
  hiddenActiveAtOpd: number;
  /** คนกำลังเดินทาง */
  inTransit: number;
  /** คนที่โรงอาหาร ตอนนี้ */
  atCafeteria: number;
  /** คนที่ห้องน้ำ ตอนนี้ (ทุกตึก) */
  atRestroom: number;
  /** ห้องน้ำที่มีความเสี่ยง quanta สูงสุด */
  peakRestroomZoneId: number;
  peakRestroomRisk: number;
  /** ผู้เยี่ยม/คนเดินทั่วไป */
  visitors: number;
  /** คนที่ OPD ทั้งหมด (รวมผู้ป่วยทั่วไป + รอคัดกรอง) */
  atOpd: number;
  /** กำลังเดินจาก OPD ไป TB หลัง IDEN */
  opdToTbTransit: number;
  /** ผ่าน IDEN แล้ว รอส่งจาก OPD */
  idenReadyAtOpd: number;
}
