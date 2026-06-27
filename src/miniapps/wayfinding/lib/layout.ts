/**
 * โลกจำลอง รพ.นครพิงค์ — มุมมอง bird's eye
 * อิงข้อมูลล่าสุดจากเว็บทางการ: อาคารผู้ป่วยนอก/อุบัติเหตุฉุกเฉิน 7 ชั้น (อาคาร 3) หน้าสุด,
 * อาคาร 10 ชั้นหลังใหม่กำลังก่อสร้าง (2569-2572), โรงอาหาร, 7-11, ลานจอด
 *
 * พิกัด: x = ตะวันออก-ตะวันตก, z = เหนือ-ใต้, y = ขึ้นบน (เมตร)
 * ทางเข้าอยู่ทางใต้ (z มาก) อาคารอยู่เหนือขึ้นไป
 */

/** ป้ายความหมายของจุด — ใช้ผูกกับ itinerary ของคน */
export type PlaceTag =
  | "gate"
  | "dropoff"
  | "courtyard"
  | "screening"
  | "info"
  | "seven"
  | "food"
  | "garden"
  | "er"
  | "ipd"
  | "parking"
  | "restroom"
  | "opd_entry"
  | "register"
  | "lab"
  | "cashier"
  | "pharmacy"
  | "lift"
  | "obgyn"
  | "ped"
  | "med"
  | "ekg"
  | "eye"
  | "ent";

export type NodeKind =
  | "gate"
  | "hub"
  | "junction"
  | "service"
  | "vertical"
  | "place"
  | "rest";

export interface NavNode {
  id: number;
  name: string;
  code: string;
  tag: PlaceTag;
  kind: NodeKind;
  /** [x, z] บนพื้น */
  pos: [number, number];
  /** ชั้น 0..3 (F1..F4) สำหรับ node ในอาคาร OPD; กลางแจ้ง = 0 */
  floor: number;
  /** เป็นจุดตัดสินใจ (เกิดการเลี้ยวผิดได้) */
  decision: boolean;
  /** ความซับซ้อนพื้นฐานของจุด 0..1 */
  complexity: number;
  /** เป็นปลายทางใน itinerary ได้ */
  dest: boolean;
}

/** ระยะห่างแนวตั้งต่อชั้น (เมตร) สำหรับเรนเดอร์ exploded floor stack */
export const FLOOR_GAP = 5.2;

function n(
  id: number,
  tag: PlaceTag,
  code: string,
  name: string,
  kind: NodeKind,
  pos: [number, number],
  opts: Partial<Pick<NavNode, "floor" | "decision" | "complexity" | "dest">> = {}
): NavNode {
  return {
    id,
    tag,
    code,
    name,
    kind,
    pos,
    floor: opts.floor ?? 0,
    decision: opts.decision ?? false,
    complexity: opts.complexity ?? 0.2,
    dest: opts.dest ?? false,
  };
}

/** จุดนำทางทั้งหมด (index = id) */
export const NODES: NavNode[] = [
  // ---- กลางแจ้ง (ชั้นพื้น) ----
  n(0, "gate", "GATE", "ทางเข้า ถ.โชตนา", "gate", [0, 100], { dest: true }),
  n(1, "dropoff", "DROP", "จุดส่งผู้ป่วย", "junction", [0, 64], { complexity: 0.3 }),
  n(2, "courtyard", "ลาน", "ลานกลาง รพ.", "hub", [0, 50], {
    decision: true,
    complexity: 0.95,
  }),
  n(3, "info", "i", "ประชาสัมพันธ์", "place", [18, 53], {
    dest: true,
    decision: true,
    complexity: 0.6,
  }),
  n(4, "seven", "7-11", "เซเว่น", "place", [42, 58], { dest: true, complexity: 0.2 }),
  n(5, "food", "อาหาร", "โรงอาหาร", "place", [-52, -4], { dest: true, complexity: 0.4 }),
  n(6, "garden", "สวน", "ลานพักผ่อน", "rest", [-26, 62], { dest: true, complexity: 0.2 }),
  n(7, "er", "ER", "อุบัติเหตุฉุกเฉิน", "place", [-48, 34], { dest: true, complexity: 0.4 }),
  n(8, "ipd", "IPD", "อาคารผู้ป่วยใน", "place", [56, -18], { dest: true, complexity: 0.5 }),
  n(9, "parking", "P1", "ลานจอด P1", "place", [-76, 46], { dest: true, complexity: 0.3 }),
  n(10, "parking", "P2", "ลานจอด P2", "place", [66, -52], { dest: true, complexity: 0.3 }),
  n(11, "parking", "P3", "ลานจอด P3", "place", [80, 26], { dest: true, complexity: 0.3 }),
  n(12, "restroom", "WC", "ห้องน้ำลานกลาง", "place", [24, 38], { dest: true, complexity: 0.25 }),

  // ---- อาคาร OPD 7 ชั้น (อาคาร 3) ----
  // F1 (floor 0)
  n(13, "opd_entry", "โถง", "โถงหน้า OPD ชั้น 1", "hub", [0, 30], {
    decision: true,
    complexity: 0.85,
  }),
  n(14, "register", "เวชระเบียน", "เวชระเบียน (ชั้น 1)", "service", [-17, 16], {
    dest: true,
    decision: true,
    complexity: 0.72,
  }),
  n(15, "lab", "เจาะเลือด", "ห้องเจาะเลือด (ชั้น 1)", "service", [17, 16], {
    dest: true,
    complexity: 0.4,
  }),
  n(16, "cashier", "การเงิน", "การเงิน (ชั้น 1)", "service", [-17, 5], {
    dest: true,
    complexity: 0.35,
  }),
  n(17, "pharmacy", "ห้องยา", "ห้องจ่ายยา (ชั้น 1)", "service", [17, 5], {
    dest: true,
    complexity: 0.35,
  }),
  n(18, "restroom", "WC-1", "ห้องน้ำ OPD ชั้น 1", "place", [9, 9], { dest: true, complexity: 0.2 }),
  n(19, "lift", "ลิฟต์", "ลิฟต์/บันได ชั้น 1", "vertical", [0, 9], {
    floor: 0,
    decision: true,
    complexity: 0.7,
  }),
  // F2 (floor 1) สูติ-นรีเวช, กุมาร
  n(20, "lift", "ลิฟต์2", "ลิฟต์ ชั้น 2", "vertical", [0, 9], {
    floor: 1,
    decision: true,
    complexity: 0.75,
  }),
  n(21, "obgyn", "สูติ-นรีเวช", "สูติ-นรีเวชกรรม (ชั้น 2)", "service", [-15, 3], {
    floor: 1,
    dest: true,
    complexity: 0.4,
  }),
  n(22, "ped", "กุมาร", "กุมารเวชกรรม (ชั้น 2)", "service", [15, 3], {
    floor: 1,
    dest: true,
    complexity: 0.4,
  }),
  // F3 (floor 2) อายุรกรรม, EKG
  n(23, "lift", "ลิฟต์3", "ลิฟต์ ชั้น 3", "vertical", [0, 9], {
    floor: 2,
    decision: true,
    complexity: 0.75,
  }),
  n(24, "med", "อายุรกรรม", "อายุรกรรม (ชั้น 3)", "service", [-15, 3], {
    floor: 2,
    dest: true,
    complexity: 0.45,
  }),
  n(25, "ekg", "หัวใจ/EKG", "คลื่นไฟฟ้าหัวใจ (ชั้น 3)", "service", [15, 3], {
    floor: 2,
    dest: true,
    complexity: 0.45,
  }),
  // F4 (floor 3) จักษุ, หูคอจมูก
  n(26, "lift", "ลิฟต์4", "ลิฟต์ ชั้น 4", "vertical", [0, 9], {
    floor: 3,
    decision: true,
    complexity: 0.7,
  }),
  n(27, "eye", "จักษุ", "จักษุ (ชั้น 4)", "service", [-15, 3], {
    floor: 3,
    dest: true,
    complexity: 0.4,
  }),
  n(28, "ent", "หูคอจมูก", "หูคอจมูก (ชั้น 4)", "service", [15, 3], {
    floor: 3,
    dest: true,
    complexity: 0.4,
  }),
  // ---- จุดคัดกรอง/identification หน้า OPD (ด่านแรกของผู้ป่วย) ----
  n(29, "screening", "คัดกรอง", "จุดคัดกรอง/ซักประวัติ/รับบัตรคิว", "hub", [-6, 41], {
    dest: true,
    decision: true,
    complexity: 0.92,
  }),
];

export const NODE_COUNT = NODES.length;

/** ดัชนีอ้างอิงด่วน */
export const NID = {
  GATE: 0,
  DROPOFF: 1,
  COURTYARD: 2,
  INFO: 3,
  SEVEN: 4,
  FOOD: 5,
  GARDEN: 6,
  ER: 7,
  IPD: 8,
  P1: 9,
  P2: 10,
  P3: 11,
  WC_COURT: 12,
  OPD_ENTRY: 13,
  REGISTER: 14,
  LAB: 15,
  CASHIER: 16,
  PHARMACY: 17,
  WC_OPD: 18,
  LIFT1: 19,
  LIFT2: 20,
  OBGYN: 21,
  PED: 22,
  LIFT3: 23,
  MED: 24,
  EKG: 25,
  LIFT4: 26,
  EYE: 27,
  ENT: 28,
  SCREENING: 29,
} as const;

interface EdgeDef {
  a: number;
  b: number;
  /** เป็นเส้นทางกลางแจ้ง (โดนฝน/แดด) */
  outdoor: boolean;
  /** เป็นการเคลื่อนที่แนวตั้ง (ลิฟต์/บันได) */
  vertical?: boolean;
}

const E = (a: number, b: number, outdoor = true, vertical = false): EdgeDef => ({
  a,
  b,
  outdoor,
  vertical,
});

export const EDGES: EdgeDef[] = [
  E(NID.GATE, NID.DROPOFF),
  E(NID.DROPOFF, NID.COURTYARD),
  E(NID.COURTYARD, NID.INFO),
  E(NID.COURTYARD, NID.SEVEN),
  E(NID.COURTYARD, NID.FOOD),
  E(NID.COURTYARD, NID.ER),
  E(NID.COURTYARD, NID.IPD),
  E(NID.COURTYARD, NID.P1),
  E(NID.COURTYARD, NID.P3),
  E(NID.COURTYARD, NID.GARDEN),
  E(NID.COURTYARD, NID.WC_COURT),
  E(NID.COURTYARD, NID.OPD_ENTRY),
  E(NID.COURTYARD, NID.SCREENING),
  E(NID.SCREENING, NID.OPD_ENTRY),
  E(NID.INFO, NID.SCREENING),
  E(NID.INFO, NID.OPD_ENTRY),
  E(NID.INFO, NID.SEVEN),
  E(NID.IPD, NID.P2),
  E(NID.ER, NID.P1),
  E(NID.FOOD, NID.GARDEN),
  // ภายใน OPD ชั้น 1
  E(NID.OPD_ENTRY, NID.REGISTER, false),
  E(NID.OPD_ENTRY, NID.LAB, false),
  E(NID.OPD_ENTRY, NID.CASHIER, false),
  E(NID.OPD_ENTRY, NID.PHARMACY, false),
  E(NID.OPD_ENTRY, NID.WC_OPD, false),
  E(NID.OPD_ENTRY, NID.LIFT1, false),
  E(NID.REGISTER, NID.LAB, false),
  E(NID.CASHIER, NID.PHARMACY, false),
  // แนวตั้ง (ลิฟต์)
  E(NID.LIFT1, NID.LIFT2, false, true),
  E(NID.LIFT2, NID.LIFT3, false, true),
  E(NID.LIFT3, NID.LIFT4, false, true),
  // F2
  E(NID.LIFT2, NID.OBGYN, false),
  E(NID.LIFT2, NID.PED, false),
  // F3
  E(NID.LIFT3, NID.MED, false),
  E(NID.LIFT3, NID.EKG, false),
  // F4
  E(NID.LIFT4, NID.EYE, false),
  E(NID.LIFT4, NID.ENT, false),
];

/** ตำแหน่ง 3D ของ node (รวมความสูงตามชั้น) */
export function nodePos3(id: number): [number, number, number] {
  const nd = NODES[id];
  return [nd.pos[0], nd.floor * FLOOR_GAP, nd.pos[1]];
}

export function nodeHeight(id: number): number {
  return NODES[id].floor * FLOOR_GAP;
}

function dist3(a: number, b: number, vertical: boolean): number {
  const pa = nodePos3(a);
  const pb = nodePos3(b);
  const dx = pa[0] - pb[0];
  const dy = pa[1] - pb[1];
  const dz = pa[2] - pb[2];
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  // ลิฟต์มีต้นทุนเวลารอเพิ่ม
  return vertical ? d + 14 : d;
}

interface AdjEntry {
  to: number;
  dist: number;
  outdoor: boolean;
  vertical: boolean;
}

/** รายการเพื่อนบ้านของแต่ละ node */
export const ADJ: AdjEntry[][] = (() => {
  const adj: AdjEntry[][] = NODES.map(() => []);
  for (const e of EDGES) {
    const d = dist3(e.a, e.b, !!e.vertical);
    adj[e.a].push({ to: e.b, dist: d, outdoor: e.outdoor, vertical: !!e.vertical });
    adj[e.b].push({ to: e.a, dist: d, outdoor: e.outdoor, vertical: !!e.vertical });
  }
  return adj;
})();

/** ระยะตรงระหว่าง node บนพื้น (สำหรับ detour) */
export function groundDistance(a: number, b: number): number {
  const pa = NODES[a].pos;
  const pb = NODES[b].pos;
  return Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
}

export interface PathResult {
  path: number[];
  dist: number;
}

/**
 * Dijkstra สั้นสุด — weightFn ปรับน้ำหนักได้ (เช่น เลี่ยงจุดแออัด)
 */
export function shortestPath(
  from: number,
  to: number,
  weightFn?: (toId: number, baseDist: number, e: AdjEntry) => number
): PathResult {
  if (from === to) return { path: [from], dist: 0 };
  const dist = new Array(NODE_COUNT).fill(Infinity);
  const prev = new Array(NODE_COUNT).fill(-1);
  const visited = new Array(NODE_COUNT).fill(false);
  dist[from] = 0;
  for (let iter = 0; iter < NODE_COUNT; iter++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < NODE_COUNT; i++) {
      if (!visited[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    }
    if (u === -1) break;
    if (u === to) break;
    visited[u] = true;
    for (const e of ADJ[u]) {
      const w = weightFn ? weightFn(e.to, e.dist, e) : e.dist;
      const nd = dist[u] + w;
      if (nd < dist[e.to]) {
        dist[e.to] = nd;
        prev[e.to] = u;
      }
    }
  }
  if (dist[to] === Infinity) return { path: [from, to], dist: groundDistance(from, to) };
  const path: number[] = [];
  let c = to;
  while (c !== -1) {
    path.unshift(c);
    c = prev[c];
  }
  return { path, dist: dist[to] };
}

/** node ที่มี tag ที่กำหนด */
export function nodesByTag(tag: PlaceTag): number[] {
  const out: number[] = [];
  for (const nd of NODES) if (nd.tag === tag) out.push(nd.id);
  return out;
}

export function firstNodeByTag(tag: PlaceTag): number {
  return nodesByTag(tag)[0] ?? NID.COURTYARD;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---------------- ข้อมูลสำหรับเรนเดอร์ ----------------

export const WORLD_SIZE = 260;

/** อาคาร OPD 7 ชั้น (exploded floor stack) */
export const OPD = {
  center: [0, 12] as [number, number],
  size: [50, 34] as [number, number],
  /** ชั้นที่มองเห็นเป็นแผ่น (F1-F4 มีบริการ) + ชั้นสำนักงาน 5-7 รวบเป็นหอบน */
  serviceFloors: 4,
  officeFloors: 3,
};

export interface OpdFloorInfo {
  floor: number;
  label: string;
  rooms: string;
}

/** directory จริงจากเว็บ รพ.นครพิงค์ */
export const OPD_DIRECTORY: OpdFloorInfo[] = [
  { floor: 1, label: "ชั้น 1", rooms: "เวชระเบียน · ศัลยกรรม · เจาะเลือด · การเงิน · จ่ายยา" },
  { floor: 2, label: "ชั้น 2", rooms: "สูติ-นรีเวช · ฝากครรภ์ · กุมารเวช" },
  { floor: 3, label: "ชั้น 3", rooms: "อายุรกรรม · คลินิกพิเศษ · โรคเรื้อรัง · EKG" },
  { floor: 4, label: "ชั้น 4", rooms: "จักษุ · หู คอ จมูก" },
  { floor: 5, label: "ชั้น 5", rooms: "สำนักงานผู้อำนวยการ · บริหาร" },
  { floor: 6, label: "ชั้น 6", rooms: "ยุทธศาสตร์ · IT · เภสัชกรรม" },
  { floor: 7, label: "ชั้น 7", rooms: "พัฒนาระบบบริการ · IC" },
];

export interface SimpleBuilding {
  position: [number, number];
  size: [number, number];
  height: number;
  radius?: number;
  color: string;
  label: string;
  accent?: string;
}

/** อาคารประกอบฉาก (นอกเหนือ OPD ที่วาดแยก) */
export const BUILDINGS: SimpleBuilding[] = [
  {
    position: [-48, 34],
    size: [26, 20],
    height: 12,
    radius: 1,
    color: "#fde0d2",
    accent: "#e0732f",
    label: "อุบัติเหตุ-ฉุกเฉิน (ER)",
  },
  {
    position: [56, -18],
    size: [30, 24],
    height: 30,
    radius: 1.4,
    color: "#e7eef9",
    accent: "#5b6675",
    label: "อาคารผู้ป่วยใน (IPD)",
  },
  {
    position: [-52, -6],
    size: [22, 16],
    height: 9,
    radius: 1,
    color: "#fdebc8",
    accent: "#f0a341",
    label: "โรงอาหาร",
  },
  {
    position: [42, 58],
    size: [12, 9],
    height: 5,
    radius: 0.6,
    color: "#d6f0dd",
    accent: "#1a8a4a",
    label: "7-11",
  },
  {
    position: [18, 53],
    size: [9, 7],
    height: 4,
    radius: 0.5,
    color: "#e7eef9",
    accent: "#2f6df0",
    label: "ประชาสัมพันธ์",
  },
];

/** ไซต์ก่อสร้างอาคาร 10 ชั้นหลังใหม่ (2569-2572) */
export const CONSTRUCTION = {
  position: [40, -2] as [number, number],
  size: [40, 30] as [number, number],
  label: "อาคาร 10 ชั้นหลังใหม่ (กำลังก่อสร้าง 2569-2572)",
};

export interface ParkingLot {
  position: [number, number];
  size: [number, number];
  rows: number;
  cols: number;
  rotation?: number;
  label: string;
}

export const PARKINGS: ParkingLot[] = [
  { position: [-80, 48], size: [26, 30], rows: 4, cols: 3, rotation: 0.12, label: "P1" },
  { position: [70, -56], size: [30, 22], rows: 3, cols: 5, rotation: -0.1, label: "P2" },
  { position: [86, 26], size: [22, 30], rows: 4, cols: 3, rotation: -0.06, label: "P3" },
];

/** จุดสังเกต (landmark) สำหรับโซลูชัน landmark + ตกแต่งฉาก */
export interface Landmark {
  position: [number, number];
  kind: "fountain" | "tree" | "sign" | "seven";
  label?: string;
  color?: string;
}

export const LANDMARKS: Landmark[] = [
  { position: [0, 44], kind: "fountain", label: "น้ำพุลานกลาง", color: "#38bdf8" },
  { position: [42, 58], kind: "seven", label: "7-11", color: "#1a8a4a" },
  { position: [-26, 62], kind: "tree" },
  { position: [-18, 46], kind: "tree" },
  { position: [20, 44], kind: "tree" },
  { position: [30, 30], kind: "tree" },
  { position: [-34, 20], kind: "tree" },
  { position: [12, 62], kind: "tree" },
];
