/**
 * NKP Wayfinding & Human Traffic — โมเดลข้อมูล
 * แนวคิดหลัก: ชีวิตคนใน รพ. ไม่ใช่แค่ A→B แต่คือ การเคลื่อนที่ + การรอ + สภาวะจิตใจ
 */

export type WeatherKind = "clear" | "rain" | "storm";

export interface WeatherProfile {
  /** ระดับความแรงฝน 0..1 */
  rainLevel: number;
  /** ตัวคูณจำนวนคนที่มา รพ. (ฝนตก คนเลื่อน/น้อยลงเล็กน้อย) */
  crowdMult: number;
  /** ตัวคูณความเร็วเดินกลางแจ้ง (ฝน/แดดทำให้ช้า) */
  outdoorMoveMult: number;
  /** ตัวคูณโอกาสหลง (ทัศนวิสัยแย่ มองป้ายไม่ชัด) */
  confusionMult: number;
  /** สัดส่วนคนที่ต้องหลบ (ฝน) — เพิ่ม dwell ใต้หลังคา */
  shelterRatio: number;
  label: string;
}

export const WEATHER: Record<WeatherKind, WeatherProfile> = {
  clear: {
    rainLevel: 0,
    crowdMult: 1,
    outdoorMoveMult: 1,
    confusionMult: 1,
    shelterRatio: 0,
    label: "แดดปกติ",
  },
  rain: {
    rainLevel: 0.55,
    crowdMult: 0.88,
    outdoorMoveMult: 0.66,
    confusionMult: 1.25,
    shelterRatio: 0.7,
    label: "ฝนปรอย",
  },
  storm: {
    rainLevel: 1,
    crowdMult: 0.72,
    outdoorMoveMult: 0.45,
    confusionMult: 1.5,
    shelterRatio: 1,
    label: "ฝนตกหนัก",
  },
};

/** มุมมองระบบที่กำลังดู (ระบบ sim 3 ระบบในตัวเดียว) */
export type SystemView = "traffic" | "insights" | "solutions";

/** สาเหตุที่คนหลงทาง (อิงจุดปัญหาจริงของ รพ.นครพิงค์) */
export type LostCause =
  | "sequence" // ไม่รู้ลำดับ: คัดกรอง → เวชระเบียน → ตรวจ
  | "building" // หาตึกผิด ระหว่างอาคาร
  | "floor" // หลงชั้น ลิฟต์/บันได
  | "department" // หาห้อง/จุดบริการในแผนก
  | "signage"; // ป้ายไม่ชัด/อ่านยาก

export const LOST_CAUSES: LostCause[] = [
  "sequence",
  "building",
  "floor",
  "department",
  "signage",
];

export const LOST_CAUSE_LABEL: Record<LostCause, string> = {
  sequence: "ไม่รู้ลำดับ (คัดกรอง/เวชระเบียน)",
  building: "หาตึกผิด (ระหว่างอาคาร)",
  floor: "หลงชั้น (ลิฟต์/บันได)",
  department: "หาห้องในแผนก",
  signage: "ป้ายไม่ชัด/อ่านยาก",
};

export const LOST_CAUSE_COLOR: Record<LostCause, string> = {
  sequence: "#ec5b54",
  building: "#e0732f",
  floor: "#a78bfa",
  department: "#2f6df0",
  signage: "#f0a341",
};

/** ประเภทคนใน รพ. */
export type PersonKind =
  | "appointment" // ผู้ป่วยนัด — มีแผนชัด คุ้นทาง
  | "walkin" // ผู้ป่วย walk-in — ไม่คุ้น สับสนง่าย
  | "emergency" // ฉุกเฉิน — รีบ ตรงไป ER
  | "caregiver" // ญาติ/ผู้ดูแล — เดินตาม + ทำธุระแทน
  | "elder" // ผู้สูงอายุ — ช้า อ่านป้ายยาก หลงง่าย
  | "staff" // หมอ/พยาบาล/เจ้าหน้าที่ — คุ้นทางมาก ไม่หลง
  | "vendor"; // แม่ค้า/เซลส์/ส่งของ — วนเฉพาะโซน

export const PERSON_KINDS: PersonKind[] = [
  "appointment",
  "walkin",
  "emergency",
  "caregiver",
  "elder",
  "staff",
  "vendor",
];

/** กิจกรรมชีวิตปัจจุบัน */
export type LifeActivity =
  | "transit" // กำลังเดิน
  | "queue" // ต่อคิว
  | "service" // รับบริการ (ตรวจ/เจาะเลือด/จ่ายยา)
  | "restroom" // ห้องน้ำ
  | "eating" // กินข้าว โรงอาหาร
  | "shopping" // 7-11
  | "parking" // หาที่จอดรถ
  | "resting" // นั่งพัก
  | "asking" // ถามทาง / info desk
  | "lost" // หลง กำลังวนหา
  | "leaving" // กำลังกลับบ้าน
  | "idle";

/** โซลูชันการนำทาง (ระบบที่ 3) — baseline = ไม่เปิดอันใดเลย */
export type NavSolution =
  | "color_path" // เส้นสีบนพื้นแยกแผนก (frugal)
  | "landmark" // ป้ายอิงจุดสังเกต 7-11/น้ำพุ/สีอาคาร
  | "mini_map" // แผนที่จุดต่อจุดสั้นๆ + landmark (frugal)
  | "volunteer" // จิตอาสา + info desk (human-in-the-loop)
  | "qr_kiosk" // QR/Kiosk ดิจิทัล เส้นทาง+คิว
  | "ibeacon_line" // iBeacon ตามพื้นที่ sync กับ LINE ผู้ป่วย
  | "queue_aware"; // นำทางเลี่ยงจุดแออัด

export const NAV_SOLUTIONS: NavSolution[] = [
  "color_path",
  "landmark",
  "mini_map",
  "volunteer",
  "qr_kiosk",
  "ibeacon_line",
  "queue_aware",
];

export interface NavSolutionMeta {
  key: NavSolution;
  label: string;
  short: string;
  /** ระดับการลงทุน 1=frugal มาก .. 5=infra หนัก */
  costLevel: number;
  /** ที่มา/กรณีศึกษา */
  note: string;
}

export const NAV_SOLUTION_META: Record<NavSolution, NavSolutionMeta> = {
  color_path: {
    key: "color_path",
    label: "เส้นสีนำทางบนพื้น",
    short: "เส้นสี",
    costLevel: 1,
    note: "ทาสีเส้นบนพื้นแยกตามแผนก (เช่น รพ.หลายแห่งใน UK/ญี่ปุ่น) — ถูก ทำได้จริง",
  },
  landmark: {
    key: "landmark",
    label: "ป้ายอิงจุดสังเกต",
    short: "Landmark",
    costLevel: 2,
    note: "ใช้ 7-11/น้ำพุ/สีอาคารเป็นหมุดจำ ช่วยผู้สูงอายุ/อ่านน้อย",
  },
  mini_map: {
    key: "mini_map",
    label: "แผนที่จุดต่อจุด + จุดสังเกต",
    short: "Mini-map",
    costLevel: 1,
    note: "แผนที่ทางลัดสั้นๆ ทีละช่วง พร้อม landmark (พิมพ์/ป้ายตั้งตามทาง) — ถูกมาก ทำได้ทันที",
  },
  volunteer: {
    key: "volunteer",
    label: "จิตอาสานำทาง + จุดสอบถาม",
    short: "จิตอาสา",
    costLevel: 2,
    note: "human-in-the-loop คอยกู้คนหลงที่จุดตัด (อสม./นักศึกษา)",
  },
  qr_kiosk: {
    key: "qr_kiosk",
    label: "QR / ตู้ Kiosk ดิจิทัล",
    short: "QR/Kiosk",
    costLevel: 4,
    note: "นำทาง+คิวบนมือถือ แต่ขึ้นกับการเข้าถึงดิจิทัลของผู้ป่วย",
  },
  ibeacon_line: {
    key: "ibeacon_line",
    label: "iBeacon + LINE ผู้ป่วย",
    short: "iBeacon/LINE",
    costLevel: 4,
    note: "ติด iBeacon ตามพื้นที่ ส่งนำทาง+คิวเข้าแอป LINE ของผู้ป่วยอัตโนมัติ (proactive) — ช่วยเรื่องหลงชั้น",
  },
  queue_aware: {
    key: "queue_aware",
    label: "นำทางเลี่ยงจุดแออัด",
    short: "เลี่ยงคิว",
    costLevel: 5,
    note: "ต้องมี sensor/ระบบคิวเรียลไทม์ ป้ายดิจิทัลปรับเส้นทาง",
  },
};

export interface SimConfig {
  weather: WeatherKind;
  /** จำลองช่วงเวลาในวัน (พีคเช้า เจาะเลือด/เวชระเบียนแน่น) */
  timeOfDay: boolean;
  /** ตัวคูณความเร็วจำลอง */
  simSpeed: number;
  /** อัตราคนเข้า รพ. (คน/ชม.) */
  arrivalRate: number;
  /** จำนวนคนในฉากสูงสุด */
  maxCrowd: number;

  /** สัดส่วนผู้สูงอายุ (0..1) — หลงง่าย เดินช้า */
  elderRatio: number;
  /** สัดส่วนญาติ/ผู้ดูแลที่มาด้วย (0..1) */
  caregiverRatio: number;
  /** สัดส่วนผู้มีข้อจำกัดการเคลื่อนไหว (วีลแชร์/ไม้เท้า) 0..1 */
  mobilityImpairedRatio: number;
  /** ระดับ "ความต้องการชีวิต" (ห้องน้ำ/กิน/7-11/พัก) 0..1 */
  lifeNeeds: number;
  /** ความแรงของพีคตามช่วงเวลา (0.5..2) */
  peakIntensity: number;

  // ---- หลักการความสับสน (ระบบที่ 2) ----
  /** คุณภาพป้ายพื้นฐาน 0..1 (ยิ่งต่ำ ยิ่งหลง) */
  signageQuality: number;
  /** ความซับซ้อนของจุดตัดสินใจ 0..1 */
  junctionComplexity: number;
  /** ความเด่นของ landmark พื้นฐาน 0..1 */
  landmarkSalience: number;
  /** ความสับสนการขึ้นผิดชั้น/ลิฟต์ 0..1 */
  floorConfusion: number;
  /** ความแออัดบังการมองเห็นป้าย 0..1 */
  crowdBlindness: number;
  /** แนวโน้มที่คนจะยอมถามทาง 0..1 */
  askPropensity: number;
  /** ความสับสนเรื่องลำดับ (ไม่รู้ว่าต้องคัดกรอง/เวชระเบียนก่อน) 0..1 */
  sequenceConfusion: number;

  // ---- โซลูชันการนำทาง (ระบบที่ 3) ----
  solutions: Record<NavSolution, boolean>;
  /** ความครอบคลุมของป้าย/เส้นสี/แผนที่ 0..1 */
  signageCoverage: number;
  /** จำนวนจิตอาสา */
  volunteerCount: number;
  /** อัตราการใช้ QR/Kiosk ดิจิทัลของผู้ป่วย 0..1 */
  digitalAdoption: number;
  /** ความครอบคลุมของ iBeacon ตามพื้นที่ 0..1 */
  beaconCoverage: number;
  /** อัตราผู้ป่วยที่ผูกบัญชี LINE กับ รพ. 0..1 */
  lineAdoption: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  weather: "clear",
  timeOfDay: true,
  simSpeed: 5,
  arrivalRate: 520,
  maxCrowd: 900,
  elderRatio: 0.3,
  caregiverRatio: 0.35,
  mobilityImpairedRatio: 0.12,
  lifeNeeds: 0.6,
  peakIntensity: 1,

  signageQuality: 0.4,
  junctionComplexity: 0.6,
  landmarkSalience: 0.35,
  floorConfusion: 0.5,
  crowdBlindness: 0.5,
  askPropensity: 0.5,
  sequenceConfusion: 0.55,

  solutions: {
    color_path: false,
    landmark: false,
    mini_map: false,
    volunteer: false,
    qr_kiosk: false,
    ibeacon_line: false,
    queue_aware: false,
  },
  signageCoverage: 0.6,
  volunteerCount: 6,
  digitalAdoption: 0.45,
  beaconCoverage: 0.7,
  lineAdoption: 0.55,
};

export interface AgentSnapshot {
  id: number;
  kind: PersonKind;
  activity: LifeActivity;
  /** ตำแหน่ง [x, z] */
  position: [number, number];
  /** ความสูง (y) ตามชั้นอาคาร */
  height: number;
  /** กำลังเดินทาง */
  inTransit: boolean;
  /** สภาวะรวม 0..1 (เครียด+เหนื่อย+สับสน) ใช้ระบายสี */
  distress: number;
  confusion: number;
  /** เคยหลงในรอบนี้ */
  hasBeenLost: boolean;
  /** ใช้โซลูชันดิจิทัลอยู่ */
  usingDigital: boolean;
}

export interface NodeSnapshot {
  id: number;
  /** จำนวนคนที่อยู่/ผ่านบริเวณนี้ตอนนี้ */
  occupancy: number;
  /** คิว (ที่จุดบริการ) */
  queue: number;
  /** ความสับสนสะสม (จำนวนการเลี้ยวผิดที่จุดนี้ ถ่วงเวลา) */
  confusionHeat: number;
  /** เป็นจุดตัดสินใจ */
  decision: boolean;
}

/** เส้นทางคนหลง (สำหรับวาด trail) */
export interface LostTrail {
  id: number;
  points: [number, number, number][];
  age: number;
}

export interface SimStats {
  simTime: number;
  dayMinutes: number;
  crowdFactor: number;
  periodLabel: string;
  totalAgents: number;
  inTransit: number;
  // ---- ระบบ 1: human traffic ----
  atRestroom: number;
  atFood: number;
  atShop: number;
  atParking: number;
  resting: number;
  inQueue: number;
  /** กระแสคนเข้า รพ. สะสม */
  arrived: number;
  /** คนกลับบ้านสำเร็จสะสม */
  departed: number;
  // ---- ระบบ 2: insights การหลง ----
  lostNow: number;
  lostEventsTotal: number;
  /** % คนที่ถึงปลายทางได้โดยไม่หลงเลย (สะสม) */
  firstTrySuccess: number;
  /** สัดส่วนคนที่ "ตอนนี้" ไม่ได้หลง (สด) — สอดคล้องกับ lostNow */
  liveFlow: number;
  /** detour เฉลี่ย (เมตร) ของคนที่หลง */
  avgDetour: number;
  /** เวลาเสียเฉลี่ยจากการหลง (วินาที sim) */
  avgTimeLost: number;
  /** ดัชนีความเครียดเฉลี่ย 0..1 */
  avgDistress: number;
  /** จุดที่หลงบ่อยสุด */
  worstNodeId: number;
  worstNodeHeat: number;
  /** จำนวนการหลงแยกตามสาเหตุ (สะสม) */
  causeCounts: Record<LostCause, number>;
  /** จุดปัญหา top อันดับ (สะสม) */
  hotspots: { nodeId: number; count: number }[];
  /** คนยอมแพ้ไปถามทางสะสม */
  askedTotal: number;
  giveUpTotal: number;
  // ---- ระบบ 3: solutions ----
  /** จำนวนโซลูชันที่เปิด */
  activeSolutions: number;
  /** ดัชนีต้นทุน/ความเวอร์วัง 0..1 (frugal→infra) */
  costIndex: number;
  /** คะแนนประสิทธิผล 0..1 (ยิ่งสูง คนหลงน้อย/ถึงไว) */
  effectiveness: number;
  /** จิตอาสาที่กำลังช่วยคน */
  volunteersActive: number;
  /** คนที่กำลังใช้ดิจิทัล (QR/Kiosk) */
  digitalUsers: number;
  /** คนที่กำลังรับนำทางผ่าน LINE/iBeacon */
  lineUsers: number;
}
