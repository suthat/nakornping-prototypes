import {
  ADJ,
  easeInOutCubic,
  EDGES,
  firstNodeByTag,
  groundDistance,
  NavNode,
  NID,
  NODE_COUNT,
  NODES,
  nodePos3,
  nodesByTag,
  PlaceTag,
  shortestPath,
} from "./layout";
import {
  AgentSnapshot,
  LifeActivity,
  LostCause,
  LostTrail,
  NAV_SOLUTION_META,
  NodeSnapshot,
  PersonKind,
  SimConfig,
  SimStats,
  WEATHER,
  WeatherProfile,
} from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(x: number, mu: number, sigma: number): number {
  const d = x - mu;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

const START_HOUR = 7;
const DAY_MIN_PER_SEC = 2; // 1 วิ sim ≈ 2 นาทีจริง
const CROWD_REF = 11;
const SERVE_REF = 6;
/** ความยาว edge ที่ใช้ในการเดิน — เก็บไว้ใช้ซ้ำ */
const EDGE_LEN = new Map<number, number>();
function edgeKey(a: number, b: number) {
  return a < b ? a * 1000 + b : b * 1000 + a;
}
(() => {
  for (const e of EDGES) {
    const pa = nodePos3(e.a);
    const pb = nodePos3(e.b);
    let d = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
    if (e.vertical) d += 14;
    EDGE_LEN.set(edgeKey(e.a, e.b), d);
  }
})();
function legLength(a: number, b: number): number {
  return EDGE_LEN.get(edgeKey(a, b)) ?? groundDistance(a, b);
}

interface Trait {
  familiarity: number;
  literacy: number;
  speed: number;
  digitalCapable: number; // 0..1 โอกาสใช้ดิจิทัลได้
}

const TRAITS: Record<PersonKind, Trait> = {
  appointment: { familiarity: 0.5, literacy: 0.75, speed: 1.3, digitalCapable: 0.8 },
  walkin: { familiarity: 0.2, literacy: 0.6, speed: 1.3, digitalCapable: 0.6 },
  emergency: { familiarity: 0.3, literacy: 0.6, speed: 1.5, digitalCapable: 0.5 },
  caregiver: { familiarity: 0.35, literacy: 0.7, speed: 1.3, digitalCapable: 0.75 },
  elder: { familiarity: 0.3, literacy: 0.38, speed: 0.85, digitalCapable: 0.15 },
  staff: { familiarity: 0.96, literacy: 0.92, speed: 1.6, digitalCapable: 0.9 },
  vendor: { familiarity: 0.9, literacy: 0.72, speed: 1.35, digitalCapable: 0.7 },
};

interface Agent {
  id: number;
  kind: PersonKind;
  trait: Trait;
  // itinerary (node ids)
  itinerary: number[];
  itinIdx: number;
  target: number;
  // movement
  zone: number; // node ปัจจุบัน (เมื่อไม่เคลื่อนที่ = ปลายล่าสุด)
  fromId: number;
  toId: number; // -1 = กำลังพัก/รับบริการ
  edgeLen: number;
  edgeOutdoor: boolean;
  moveT: number;
  // dwell
  dwellLeft: number;
  activity: LifeActivity;
  // states 0..1
  fatigue: number;
  stress: number;
  hunger: number;
  bladder: number;
  confusion: number;
  // wayfinding
  wrongStreak: number;
  lostThisLeg: boolean;
  hasBeenLost: boolean;
  guidedLegs: number;
  legBaseline: number;
  legWalked: number;
  viaVolunteer: boolean;
  ateLunch: boolean;
  mobilityImpaired: boolean;
  // life flags
  leaving: boolean;
  exitNode: number;
  // digital
  adoptRoll: number;
  // render
  px: number;
  py: number;
  pz: number;
  trail: [number, number, number][];
  trailAccum: number;
}

export class Simulation {
  config: SimConfig;
  rand: () => number;

  simTime = 0;
  dayMinutes = START_HOUR * 60;
  agents: Agent[] = [];
  occupancy: number[] = [];
  queueLen: number[] = [];
  nodeHeat: number[] = [];
  nodeLostTotal: number[] = [];
  causeCounts: Record<LostCause, number> = {
    sequence: 0,
    building: 0,
    floor: 0,
    department: 0,
    signage: 0,
  };
  lostTrails: LostTrail[] = [];

  private nextId = 1;
  private arrivalAccum = 0;
  private volunteersBusy = 0;

  // สถิติสะสม
  private arrived = 0;
  private departed = 0;
  private departedClean = 0;
  private legsCompleted = 0;
  private lostEventsTotal = 0;
  private askedTotal = 0;
  private giveUpTotal = 0;
  private detourSum = 0;
  private detourCount = 0;
  private timeLostSum = 0;

  constructor(config: SimConfig, seed = 24680) {
    this.config = { ...config, solutions: { ...config.solutions } };
    this.rand = mulberry32(seed);
    this.reset(config, seed);
  }

  reset(config: SimConfig, seed = 24680) {
    this.config = { ...config, solutions: { ...config.solutions } };
    this.rand = mulberry32(seed);
    this.simTime = 0;
    this.dayMinutes = START_HOUR * 60;
    this.agents = [];
    this.occupancy = NODES.map(() => 0);
    this.queueLen = NODES.map(() => 0);
    this.nodeHeat = NODES.map(() => 0);
    this.nodeLostTotal = NODES.map(() => 0);
    this.causeCounts = {
      sequence: 0,
      building: 0,
      floor: 0,
      department: 0,
      signage: 0,
    };
    this.lostTrails = [];
    this.nextId = 1;
    this.arrivalAccum = 0;
    this.volunteersBusy = 0;
    this.arrived = 0;
    this.departed = 0;
    this.departedClean = 0;
    this.legsCompleted = 0;
    this.lostEventsTotal = 0;
    this.askedTotal = 0;
    this.giveUpTotal = 0;
    this.detourSum = 0;
    this.detourCount = 0;
    this.timeLostSum = 0;
    // เริ่มต้นมีคนอยู่บ้างแล้ว
    const seedN = Math.min(Math.round(config.maxCrowd * 0.4), 360);
    for (let i = 0; i < seedN; i++) this.spawnAgent(true);
    this.recomputeOccupancy();
  }

  applyConfig(config: SimConfig) {
    const structural =
      config.maxCrowd !== this.config.maxCrowd ||
      config.elderRatio !== this.config.elderRatio;
    this.config = { ...config, solutions: { ...config.solutions } };
    if (structural && this.agents.length > config.maxCrowd) {
      this.agents.length = config.maxCrowd;
    }
  }

  get weather(): WeatherProfile {
    return WEATHER[this.config.weather] ?? WEATHER.clear;
  }

  get crowdFactor(): number {
    if (!this.config.timeOfDay) return 1;
    const m = this.dayMinutes;
    const pk = this.config.peakIntensity;
    const morning = gaussian(m, 8.25 * 60, 42);
    const lunch = gaussian(m, 12 * 60, 34);
    const afternoon = gaussian(m, 14 * 60, 50);
    return (
      (0.5 + (2.5 * morning + 1.0 * lunch + 1.3 * afternoon) * pk) * this.weather.crowdMult
    );
  }

  get periodLabel(): string {
    if (!this.config.timeOfDay) return "คงที่";
    const m = this.dayMinutes;
    if (gaussian(m, 8.25 * 60, 42) > 0.6) return "เช้า — คนหลั่งไหลเข้า";
    if (gaussian(m, 12 * 60, 34) > 0.5) return "เที่ยง — ออกกินข้าว";
    if (this.crowdFactor < 0.6) return "ช่วงเงียบ";
    return "ช่วงปกติ";
  }

  private lunchFactor(): number {
    if (!this.config.timeOfDay) return 0;
    return gaussian(this.dayMinutes, 12 * 60, 38);
  }

  // ---------------- spawn ----------------

  private pickKind(): PersonKind {
    const r = this.rand();
    if (r < 0.05) return "emergency";
    if (r < 0.18) return "staff";
    if (r < 0.26) return "vendor";
    // ที่เหลือ: ญาติ/ผู้ดูแล vs ผู้ป่วย (ตาม caregiverRatio)
    if (this.rand() < this.config.caregiverRatio) return "caregiver";
    // ผู้ป่วย: บางส่วนเป็นผู้สูงอายุ (ตาม elderRatio)
    if (this.rand() < this.config.elderRatio) return "elder";
    return this.rand() < 0.5 ? "appointment" : "walkin";
  }

  private spawnNode(): number {
    const r = this.rand();
    if (r < 0.42) return NID.GATE; // มาด้วยรถเมล์/shuttle/เดิน
    if (r < 0.62) return NID.P1;
    if (r < 0.78) return NID.P3;
    if (r < 0.9) return NID.P2;
    return NID.DROPOFF;
  }

  private pickClinic(): PlaceTag {
    const pool: PlaceTag[] = ["med", "obgyn", "ped", "eye", "ent", "ekg"];
    const w = [3.2, 1.6, 1.6, 1.3, 1.3, 1.1];
    let total = 0;
    for (const x of w) total += x;
    let r = this.rand() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= w[i];
      if (r <= 0) return pool[i];
    }
    return "med";
  }

  private buildItinerary(kind: PersonKind, spawn: number): number[] {
    const it: number[] = [];
    const add = (tag: PlaceTag) => {
      const ids = nodesByTag(tag);
      if (ids.length) it.push(ids[0]);
    };
    if (kind === "emergency") {
      it.push(NID.ER);
    } else if (kind === "staff") {
      // เจ้าหน้าที่วนหลายจุด (คุ้นทาง)
      const pool = [NID.REGISTER, NID.MED, NID.IPD, NID.PHARMACY, NID.LAB, NID.EKG];
      const n = 3 + Math.floor(this.rand() * 3);
      for (let i = 0; i < n; i++) it.push(pool[Math.floor(this.rand() * pool.length)]);
    } else if (kind === "vendor") {
      const pool = [NID.FOOD, NID.SEVEN, NID.COURTYARD, NID.FOOD];
      const n = 2 + Math.floor(this.rand() * 3);
      for (let i = 0; i < n; i++) it.push(pool[Math.floor(this.rand() * pool.length)]);
    } else {
      // ผู้ป่วย: คัดกรอง → เวชระเบียน → (เจาะเลือด) → คลินิก → การเงิน → ห้องยา
      if (kind !== "caregiver") add("screening");
      add("register");
      if (this.rand() < 0.6) add("lab");
      const clinic = this.pickClinic();
      add(clinic);
      if (this.rand() < 0.55) add("cashier");
      if (this.rand() < 0.7) add("pharmacy");
      if (kind === "caregiver" && this.rand() < 0.5) {
        // ญาติแวะ 7-11 / โรงอาหาร
        add(this.rand() < 0.5 ? "seven" : "food");
      }
    }
    // ปลายทางออก
    const exitNode = spawn === NID.GATE ? NID.GATE : spawn;
    it.push(exitNode);
    return it;
  }

  private spawnAgent(seeded = false): Agent | null {
    if (this.agents.length >= this.config.maxCrowd) return null;
    const kind = this.pickKind();
    const trait = TRAITS[kind];
    const spawn = this.spawnNode();
    const itinerary = this.buildItinerary(kind, spawn);
    const impairedChance =
      this.config.mobilityImpairedRatio *
      (kind === "elder" ? 1.8 : kind === "staff" ? 0.2 : 1);
    const mobilityImpaired = kind !== "emergency" && this.rand() < impairedChance;
    const a: Agent = {
      id: this.nextId++,
      kind,
      trait,
      itinerary,
      itinIdx: 0,
      target: itinerary[0],
      zone: spawn,
      fromId: spawn,
      toId: -1,
      edgeLen: 1,
      edgeOutdoor: true,
      moveT: 0,
      dwellLeft: seeded ? this.rand() * 12 : 0,
      activity: "transit",
      fatigue: seeded ? this.rand() * 0.4 : 0,
      stress: kind === "emergency" ? 0.5 : seeded ? this.rand() * 0.2 : 0.05,
      hunger: seeded ? this.rand() * 0.5 : this.rand() * 0.2,
      bladder: seeded ? this.rand() * 0.5 : this.rand() * 0.15,
      confusion: 0,
      wrongStreak: 0,
      lostThisLeg: false,
      hasBeenLost: false,
      guidedLegs: 0,
      legBaseline: 0,
      legWalked: 0,
      viaVolunteer: false,
      ateLunch: false,
      mobilityImpaired,
      leaving: false,
      exitNode: spawn === NID.GATE ? NID.GATE : spawn,
      adoptRoll: this.rand(),
      px: NODES[spawn].pos[0],
      py: 0,
      pz: NODES[spawn].pos[1],
      trail: [],
      trailAccum: 0,
    };
    this.agents.push(a);
    this.arrived++;
    this.setTarget(a, itinerary[0]);
    return a;
  }

  private spawnArrivals(dt: number) {
    if (this.agents.length >= this.config.maxCrowd) return;
    const rate = this.config.arrivalRate * this.crowdFactor;
    this.arrivalAccum += (rate / 3600) * dt;
    let guard = 0;
    while (this.arrivalAccum >= 1 && this.agents.length < this.config.maxCrowd && guard < 40) {
      this.arrivalAccum -= 1;
      this.spawnAgent(false);
      guard++;
    }
  }

  // ---------------- wayfinding ----------------

  /** เพื่อนบ้านที่ไม่ใช่เส้นทางถูก (สำหรับเลี้ยวผิด) */
  private wrongNeighbor(zone: number, correct: number, came: number): number {
    const cands: number[] = [];
    for (const e of ADJ[zone]) {
      if (e.to === correct) continue;
      cands.push(e.to);
    }
    if (!cands.length) return correct;
    // เลี่ยงย้อนกลับทันทีถ้ามีทางเลือกอื่น
    const notBack = cands.filter((c) => c !== came);
    const pool = notBack.length ? notBack : cands;
    return pool[Math.floor(this.rand() * pool.length)];
  }

  /** ป้าย/อุปกรณ์ช่วยที่ node นี้ (รวมผลโซลูชัน) → 0..0.96 ลดโอกาสหลง */
  private signEffect(a: Agent, node: NavNode): number {
    const cfg = this.config;
    let textSign = cfg.signageQuality;
    let visualSign = 0.12 * cfg.landmarkSalience; // landmark ที่มีอยู่เดิม (7-11/น้ำพุ)

    const indoorCore =
      node.kind === "service" ||
      node.kind === "vertical" ||
      node.kind === "hub" ||
      node.floor > 0;
    const outdoorHub =
      node.floor === 0 &&
      (node.kind === "hub" || node.kind === "junction" || node.kind === "place");

    if (cfg.solutions.color_path && indoorCore) {
      visualSign += 0.34 * cfg.signageCoverage;
    }
    if (cfg.solutions.landmark && outdoorHub) {
      visualSign += 0.32 * cfg.signageCoverage * (0.6 + 0.4 * cfg.landmarkSalience);
    }
    if (cfg.solutions.mini_map && node.decision) {
      // แผนที่จุดต่อจุด + landmark: ช่วยทุกคนที่จุดตัด (อ่านน้อยก็ใช้ได้)
      visualSign += 0.26 * (0.5 + 0.5 * cfg.signageCoverage);
    }
    if (cfg.solutions.qr_kiosk && this.usingDigital(a)) {
      visualSign += 0.52; // นำทางส่วนตัวบนมือถือ (ไม่ขึ้นกับการอ่านป้าย)
    }
    if (cfg.solutions.ibeacon_line && this.usingLine(a)) {
      // iBeacon + LINE: นำทาง proactive เข้าแอป ครอบคลุมตามจุดที่ติด beacon
      visualSign += 0.6 * cfg.beaconCoverage;
    }
    if (cfg.solutions.queue_aware) {
      textSign += 0.08; // ป้ายดิจิทัลที่ hub
    }
    return clamp(textSign * a.trait.literacy + visualSign, 0, 0.97);
  }

  private usingDigital(a: Agent): boolean {
    return (
      this.config.solutions.qr_kiosk &&
      a.adoptRoll < this.config.digitalAdoption * a.trait.digitalCapable * 1.4
    );
  }

  /** ผูก LINE กับ รพ. และมีสมาร์ทโฟน (LINE แพร่หลายกว่า QR เล็กน้อย) */
  private usingLine(a: Agent): boolean {
    return (
      this.config.solutions.ibeacon_line &&
      a.adoptRoll < this.config.lineAdoption * (0.4 + 0.6 * a.trait.digitalCapable) * 1.5
    );
  }

  private wrongTurnProb(a: Agent, node: NavNode): number {
    if (a.guidedLegs > 0) return 0.02;
    const cfg = this.config;
    let base = node.complexity * (0.3 + 0.55 * cfg.junctionComplexity);
    // จุดลิฟต์/บันได = หลงชั้นง่ายตาม floorConfusion
    if (node.kind === "vertical") base *= 1 + cfg.floorConfusion;
    // จุดคัดกรอง/เวชระเบียน = สับสนลำดับ โดยเฉพาะคนไม่คุ้น
    if (node.tag === "screening" || node.tag === "register" || node.tag === "info") {
      base *= 1 + cfg.sequenceConfusion * (1 - a.trait.familiarity);
    }
    const sign = this.signEffect(a, node);
    const fam = 1 - a.trait.familiarity * 0.92;
    let state = 1 + a.stress * 0.5 + a.fatigue * 0.35 + a.confusion * 0.65;
    if (a.mobilityImpaired) state += 0.15;
    // แออัดบังป้าย (ตาม crowdBlindness)
    const crowd = 1 + Math.min(this.occupancy[node.id] / CROWD_REF, 1) * cfg.crowdBlindness;
    const weather = node.floor === 0 ? this.weather.confusionMult : 1;
    const p = base * (1 - sign) * fam * state * crowd * weather;
    return clamp(p, 0, 0.75);
  }

  /** weightFn สำหรับ queue_aware — เลี่ยง node ที่แออัด */
  private routeWeight = (toId: number, baseDist: number): number => {
    if (!this.config.solutions.queue_aware) return baseDist;
    const occ = this.occupancy[toId] / CROWD_REF;
    return baseDist * (1 + Math.min(occ, 1.5) * 0.8);
  };

  private setTarget(a: Agent, target: number) {
    a.target = target;
    const res = shortestPath(a.zone, target, this.routeWeight);
    a.legBaseline = res.dist;
    a.legWalked = 0;
    a.lostThisLeg = false;
    a.wrongStreak = 0;
    this.chooseNextHop(a);
  }

  private chooseNextHop(a: Agent) {
    if (a.zone === a.target) {
      this.arriveTarget(a);
      return;
    }
    const node = NODES[a.zone];

    // ตัดสินใจ "ถาม" ก่อน ถ้าสับสนมาก
    if (
      node.decision &&
      (a.confusion > 0.5 || a.wrongStreak >= 2) &&
      a.guidedLegs <= 0
    ) {
      if (this.tryAsk(a, node)) return; // เข้าสู่สถานะ asking (dwell)
    }

    const res = shortestPath(a.zone, a.target, this.routeWeight);
    const correct = res.path[1] ?? a.target;
    let next = correct;

    if (node.decision && a.guidedLegs <= 0) {
      const p = this.wrongTurnProb(a, node);
      if (this.rand() < p) {
        next = this.wrongNeighbor(a.zone, correct, a.fromId);
        if (next !== correct) {
          this.onWrongTurn(a, node);
        }
      }
    }
    if (a.guidedLegs > 0) a.guidedLegs--;

    this.startLeg(a, next);
  }

  private startLeg(a: Agent, next: number) {
    a.fromId = a.zone;
    a.toId = next;
    a.edgeLen = legLength(a.zone, next);
    const e = ADJ[a.zone].find((x) => x.to === next);
    a.edgeOutdoor = e ? e.outdoor : true;
    a.moveT = 0;
    if (a.activity !== "lost") a.activity = "transit";
  }

  private classifyCause(node: NavNode): LostCause {
    if (node.kind === "vertical") return "floor";
    if (node.tag === "screening" || node.tag === "register" || node.tag === "info")
      return "sequence";
    if (node.id === NID.COURTYARD || node.id === NID.DROPOFF) return "building";
    if (node.id === NID.OPD_ENTRY || node.floor > 0 || node.kind === "service")
      return "department";
    return "signage";
  }

  private onWrongTurn(a: Agent, node: NavNode) {
    a.wrongStreak++;
    a.lostThisLeg = true;
    a.hasBeenLost = true;
    a.activity = "lost";
    a.confusion = clamp(a.confusion + 0.28, 0, 1);
    a.stress = clamp(a.stress + 0.16, 0, 1);
    this.nodeHeat[node.id] += 1;
    this.nodeLostTotal[node.id] += 1;
    this.causeCounts[this.classifyCause(node)]++;
    this.lostEventsTotal++;
    a.trail = [[a.px, a.py + 0.4, a.pz]];
    a.trailAccum = 0;
  }

  /** พยายามถามทาง (จิตอาสา/info desk) */
  private tryAsk(a: Agent, node: NavNode): boolean {
    const cfg = this.config;
    // จิตอาสาประจำจุด hub/junction/vertical
    const volunteerSpot =
      node.kind === "hub" || node.kind === "junction" || node.kind === "vertical";
    if (
      cfg.solutions.volunteer &&
      volunteerSpot &&
      this.volunteersBusy < cfg.volunteerCount &&
      this.rand() < clamp((0.45 + 0.4 * cfg.signageCoverage) * (0.5 + cfg.askPropensity), 0, 0.95)
    ) {
      a.activity = "asking";
      a.viaVolunteer = true;
      a.toId = -1;
      a.dwellLeft = 3 + this.rand() * 4;
      a.guidedLegs = 4;
      a.wrongStreak = 0;
      a.confusion = clamp(a.confusion - 0.45, 0, 1);
      a.stress = clamp(a.stress - 0.2, 0, 1);
      a.lostThisLeg = false;
      this.flushTrail(a);
      this.volunteersBusy++;
      this.askedTotal++;
      return true;
    }
    // ยอมเดินไปถามที่ประชาสัมพันธ์ (ถ้าสับสนหนัก)
    if (a.wrongStreak >= 3 && a.target !== NID.INFO && this.rand() < 0.25 + 0.5 * cfg.askPropensity) {
      this.giveUpTotal++;
      a.activity = "lost";
      // แทรก INFO เป็นเป้าหมายชั่วคราว
      a.itinerary.splice(a.itinIdx, 0, NID.INFO);
      a.target = NID.INFO;
      const res = shortestPath(a.zone, NID.INFO, this.routeWeight);
      a.legBaseline = res.dist;
      this.startLeg(a, res.path[1] ?? NID.INFO);
      this.askedTotal++;
      return true;
    }
    return false;
  }

  private flushTrail(a: Agent) {
    if (a.trail.length > 2) {
      this.lostTrails.push({ id: a.id, points: a.trail, age: 0 });
      if (this.lostTrails.length > 40) this.lostTrails.shift();
    }
    a.trail = [];
  }

  // ---------------- arrival / dwell ----------------

  private arriveTarget(a: Agent) {
    const node = NODES[a.zone];
    this.legsCompleted++;
    // คิดค่า detour ของ leg นี้
    if (a.lostThisLeg) {
      const extra = Math.max(0, a.legWalked - a.legBaseline);
      this.detourSum += extra;
      this.detourCount++;
      this.flushTrail(a);
    }
    a.lostThisLeg = false;
    a.wrongStreak = 0;
    a.toId = -1;

    // ถ้าไปถามที่ INFO → ได้ guidance แล้วลบ INFO ออก
    if (node.id === NID.INFO && a.itinerary[a.itinIdx] === NID.INFO) {
      a.guidedLegs = 5;
      a.confusion = clamp(a.confusion - 0.5, 0, 1);
      a.stress = clamp(a.stress - 0.25, 0, 1);
    }

    this.applyArrivalDwell(a, node);
  }

  private applyArrivalDwell(a: Agent, node: NavNode) {
    const ranges: Record<PlaceTag, [number, number, LifeActivity]> = {
      gate: [1, 2, "leaving"],
      dropoff: [1, 3, "transit"],
      courtyard: [3, 6, "idle"],
      screening: [7, 14, "queue"],
      info: [3, 6, "asking"],
      seven: [5, 10, "shopping"],
      food: [16, 30, "eating"],
      garden: [10, 20, "resting"],
      er: [22, 40, "service"],
      ipd: [14, 26, "service"],
      parking: [6, 14, "parking"],
      restroom: [4, 9, "restroom"],
      opd_entry: [2, 4, "transit"],
      register: [8, 16, "queue"],
      lab: [6, 12, "queue"],
      cashier: [6, 12, "queue"],
      pharmacy: [8, 16, "queue"],
      lift: [3, 7, "transit"],
      obgyn: [16, 30, "service"],
      ped: [16, 30, "service"],
      med: [16, 32, "service"],
      ekg: [16, 30, "service"],
      eye: [14, 26, "service"],
      ent: [14, 26, "service"],
    };
    const [lo, hi, act] = ranges[node.tag];
    let dwell = lo + this.rand() * (hi - lo);
    // คิวยาวขึ้นตามความแออัด (จุดบริการ)
    if (act === "queue" || act === "service") {
      dwell *= 1 + Math.min(this.occupancy[node.id] / SERVE_REF, 2) * 0.6;
    }
    if (this.weather.shelterRatio > 0 && node.floor === 0 && act === "resting") {
      dwell *= 1 + this.weather.shelterRatio * 0.5;
    }
    a.dwellLeft = dwell;
    if (a.activity !== "lost") a.activity = act;
    // รีเซ็ตความต้องการเมื่อทำกิจกรรมตรงประเภท
    if (node.tag === "restroom") a.bladder = 0;
    if (node.tag === "food") {
      a.hunger = 0;
      a.ateLunch = true;
    }
    if (act === "resting") a.fatigue = clamp(a.fatigue - 0.4, 0, 1);
  }

  private onDwellDone(a: Agent) {
    if (a.viaVolunteer) {
      this.volunteersBusy = Math.max(0, this.volunteersBusy - 1);
      a.viaVolunteer = false;
    }
    const node = NODES[a.zone];

    // ออกจาก รพ. สำเร็จ
    if (a.leaving && a.zone === a.exitNode) {
      this.departAgent(a);
      return;
    }

    // ทำ INFO เสร็จ → ลบออกจาก itinerary แล้วไปต่อ
    if (node.id === NID.INFO && a.itinerary[a.itinIdx] === NID.INFO) {
      a.itinerary.splice(a.itinIdx, 1);
      const next = a.itinerary[a.itinIdx];
      if (next == null) {
        this.beginLeaving(a);
      } else {
        this.setTarget(a, next);
      }
      return;
    }

    // แทรกความต้องการชีวิต?
    if (this.maybeInjectNeed(a)) return;

    // ไปจุดถัดไปใน itinerary
    a.itinIdx++;
    if (a.itinIdx >= a.itinerary.length) {
      this.beginLeaving(a);
    } else {
      this.setTarget(a, a.itinerary[a.itinIdx]);
    }
  }

  private beginLeaving(a: Agent) {
    a.leaving = true;
    a.activity = "leaving";
    if (a.zone === a.exitNode) {
      this.departAgent(a);
      return;
    }
    this.setTarget(a, a.exitNode);
  }

  private departAgent(a: Agent) {
    this.departed++;
    if (!a.hasBeenLost) this.departedClean++;
    a.toId = -2; // ทำเครื่องหมายลบ
  }

  /** แทรกห้องน้ำ/อาหาร/พัก/7-11 ตามสภาวะ */
  private maybeInjectNeed(a: Agent): boolean {
    if (a.kind === "emergency") return false;
    if (a.leaving) return false;
    const cur = NODES[a.zone].tag;
    const lf = this.lunchFactor();
    // ปวดห้องน้ำ
    if (a.bladder > 0.78 && cur !== "restroom") {
      const wc = this.nearestTag(a.zone, "restroom");
      a.itinerary.splice(a.itinIdx + 1, 0, wc);
      a.itinIdx++;
      this.setTarget(a, wc);
      return true;
    }
    // หิว/เที่ยง
    if (
      (a.hunger > 0.8 || (lf > 0.4 && !a.ateLunch && a.hunger > 0.5)) &&
      cur !== "food" &&
      this.config.lifeNeeds > 0.2
    ) {
      const food = firstNodeByTag("food");
      a.itinerary.splice(a.itinIdx + 1, 0, food);
      a.itinIdx++;
      this.setTarget(a, food);
      return true;
    }
    // เหนื่อย → นั่งพัก
    if (a.fatigue > 0.82 && cur !== "garden" && this.rand() < 0.5) {
      const g = firstNodeByTag("garden");
      a.itinerary.splice(a.itinIdx + 1, 0, g);
      a.itinIdx++;
      this.setTarget(a, g);
      return true;
    }
    // แวะ 7-11
    if (
      this.config.lifeNeeds > 0.4 &&
      this.rand() < 0.05 * this.config.lifeNeeds &&
      cur !== "seven"
    ) {
      const s = firstNodeByTag("seven");
      a.itinerary.splice(a.itinIdx + 1, 0, s);
      a.itinIdx++;
      this.setTarget(a, s);
      return true;
    }
    return false;
  }

  private nearestTag(from: number, tag: PlaceTag): number {
    const ids = nodesByTag(tag);
    let best = ids[0];
    let bestD = Infinity;
    for (const id of ids) {
      const d = groundDistance(from, id) + Math.abs(NODES[from].floor - NODES[id].floor) * 12;
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    return best;
  }

  // ---------------- step ----------------

  private speed(a: Agent): number {
    let v = a.trait.speed * (1 - 0.3 * a.fatigue);
    if (a.kind === "emergency") v *= 1.15;
    if (a.mobilityImpaired) v *= 0.62;
    return v;
  }

  private recomputeOccupancy() {
    for (let i = 0; i < NODE_COUNT; i++) {
      this.occupancy[i] = 0;
      this.queueLen[i] = 0;
    }
    for (const a of this.agents) {
      if (a.toId === -1) {
        this.occupancy[a.zone]++;
        if (a.activity === "queue" || a.activity === "service") this.queueLen[a.zone]++;
      } else if (a.toId >= 0) {
        // นับครึ่งทางให้ปลายทาง
        this.occupancy[a.toId] += 0.5;
      }
    }
  }

  private updateStates(a: Agent, dt: number, moving: boolean) {
    const lf = this.lunchFactor();
    if (moving) {
      a.fatigue = clamp(a.fatigue + dt * 0.006 * (a.kind === "elder" ? 1.6 : 1), 0, 1);
    }
    a.bladder = clamp(a.bladder + dt * 0.004 * this.config.lifeNeeds, 0, 1.2);
    a.hunger = clamp(a.hunger + dt * (0.003 + lf * 0.006) * this.config.lifeNeeds, 0, 1.2);
    // ความเครียดจากการรอ/หลง
    if (a.activity === "lost") {
      a.stress = clamp(a.stress + dt * 0.02, 0, 1);
      this.timeLostSum += dt;
    }
    else if (a.activity === "queue" && this.occupancy[a.zone] > SERVE_REF)
      a.stress = clamp(a.stress + dt * 0.006, 0, 1);
    else a.stress = clamp(a.stress - dt * 0.004, 0, 1);
    // ความสับสนค่อยๆ ลด (เมื่อไม่ได้หลง)
    if (a.activity !== "lost") a.confusion = clamp(a.confusion - dt * 0.01, 0, 1);
  }

  private computePosition(a: Agent) {
    if (a.toId >= 0) {
      const t = easeInOutCubic(clamp(a.moveT, 0, 1));
      const p0 = nodePos3(a.fromId);
      const p1 = nodePos3(a.toId);
      a.px = p0[0] + (p1[0] - p0[0]) * t;
      a.py = p0[1] + (p1[1] - p0[1]) * t;
      a.pz = p0[2] + (p1[2] - p0[2]) * t;
    } else {
      const p = nodePos3(a.zone);
      const j = a.id * 1.618;
      const spread = NODES[a.zone].kind === "service" ? 2.2 : 3.2;
      a.px = p[0] + Math.sin(j) * spread;
      a.py = p[1];
      a.pz = p[2] + Math.cos(j * 1.3) * spread * 0.7;
    }
  }

  private updateAgents(dt: number) {
    for (const a of this.agents) {
      if (a.toId === -2) continue;
      if (a.toId === -1) {
        // dwelling
        a.dwellLeft -= dt;
        this.updateStates(a, dt, false);
        if (a.dwellLeft <= 0) this.onDwellDone(a);
      } else {
        // moving
        const v = this.speed(a) * (a.edgeOutdoor ? this.weather.outdoorMoveMult : 1);
        a.moveT += (v * dt) / Math.max(a.edgeLen, 2);
        a.legWalked += (v * dt);
        this.updateStates(a, dt, true);
        if (a.lostThisLeg) {
          a.trailAccum += dt;
          if (a.trailAccum > 0.5) {
            a.trailAccum = 0;
            a.trail.push([a.px, a.py + 0.4, a.pz]);
            if (a.trail.length > 60) a.trail.shift();
          }
        }
        if (a.moveT >= 1) {
          a.zone = a.toId;
          if (a.zone === a.target) this.arriveTarget(a);
          else this.chooseNextHop(a);
        }
      }
      this.computePosition(a);
    }
    // ลบคนที่ออกไปแล้ว
    if (this.agents.some((a) => a.toId === -2)) {
      this.agents = this.agents.filter((a) => a.toId !== -2);
    }
  }

  step(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.5);
    this.simTime += dt;
    this.dayMinutes = (this.dayMinutes + dt * DAY_MIN_PER_SEC) % 1440;

    this.recomputeOccupancy();
    this.spawnArrivals(dt);
    this.updateAgents(dt);

    // heat decay + trails age
    for (let i = 0; i < NODE_COUNT; i++) {
      this.nodeHeat[i] *= Math.exp(-dt * 0.03);
    }
    for (const t of this.lostTrails) t.age += dt;
    this.lostTrails = this.lostTrails.filter((t) => t.age < 18);
  }

  // ---------------- snapshots ----------------

  getAgentSnapshots(): AgentSnapshot[] {
    return this.agents.map((a) => {
      const distress = clamp(0.5 * a.stress + 0.3 * a.fatigue + 0.2 * a.confusion, 0, 1);
      return {
        id: a.id,
        kind: a.kind,
        activity: a.activity,
        position: [a.px, a.pz],
        height: a.py,
        inTransit: a.toId >= 0,
        distress,
        confusion: a.confusion,
        hasBeenLost: a.hasBeenLost,
        usingDigital: this.usingDigital(a) || this.usingLine(a),
      };
    });
  }

  getNodeSnapshots(): NodeSnapshot[] {
    return NODES.map((nd, i) => ({
      id: i,
      occupancy: this.occupancy[i],
      queue: this.queueLen[i],
      confusionHeat: this.nodeHeat[i],
      decision: nd.decision,
    }));
  }

  getLostTrails(): LostTrail[] {
    const live: LostTrail[] = [];
    for (const a of this.agents) {
      if (a.lostThisLeg && a.trail.length > 1) {
        live.push({ id: a.id, points: a.trail, age: 0 });
      }
    }
    return [...this.lostTrails, ...live];
  }

  private costIndex(): number {
    const cfg = this.config;
    let cost = 0;
    let maxCost = 0;
    for (const key of Object.keys(NAV_SOLUTION_META) as (keyof typeof NAV_SOLUTION_META)[]) {
      const meta = NAV_SOLUTION_META[key];
      maxCost += meta.costLevel;
      if (cfg.solutions[key]) cost += meta.costLevel;
    }
    let idx = maxCost > 0 ? cost / maxCost : 0;
    // ปรับตามพารามิเตอร์ลงทุน
    if (cfg.solutions.volunteer) idx += (cfg.volunteerCount / 30) * 0.08;
    return clamp(idx, 0, 1);
  }

  getStats(): SimStats {
    let inTransit = 0;
    let atRestroom = 0;
    let atFood = 0;
    let atShop = 0;
    let atParking = 0;
    let resting = 0;
    let inQueue = 0;
    let lostNow = 0;
    let distressSum = 0;
    let digitalUsers = 0;
    let lineUsers = 0;
    for (const a of this.agents) {
      if (a.toId >= 0) inTransit++;
      switch (a.activity) {
        case "restroom":
          atRestroom++;
          break;
        case "eating":
          atFood++;
          break;
        case "shopping":
          atShop++;
          break;
        case "parking":
          atParking++;
          break;
        case "resting":
          resting++;
          break;
        case "queue":
        case "service":
          inQueue++;
          break;
        case "lost":
          lostNow++;
          break;
      }
      distressSum += clamp(0.5 * a.stress + 0.3 * a.fatigue + 0.2 * a.confusion, 0, 1);
      if (this.usingDigital(a)) digitalUsers++;
      if (this.usingLine(a)) lineUsers++;
    }
    const avgDistress = this.agents.length ? distressSum / this.agents.length : 0;

    let worstNodeId = 0;
    let worstNodeHeat = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      if (this.nodeHeat[i] > worstNodeHeat) {
        worstNodeHeat = this.nodeHeat[i];
        worstNodeId = i;
      }
    }

    const hotspots = this.nodeLostTotal
      .map((count, nodeId) => ({ nodeId, count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // สะสม: ราย "ครั้งที่ไปถึงจุดหมาย" โดยไม่หลง
    const firstTrySuccess =
      this.legsCompleted > 0 ? 1 - this.detourCount / this.legsCompleted : 1;
    // สด: สัดส่วนคนที่ตอนนี้ไม่ได้หลง (สอดคล้องกับ lostNow)
    const liveFlow = this.agents.length > 0 ? 1 - lostNow / this.agents.length : 1;
    const avgDetour = this.detourCount > 0 ? this.detourSum / this.detourCount : 0;
    const avgTimeLost = this.detourCount > 0 ? this.timeLostSum / Math.max(1, this.detourCount) : 0;

    let activeSolutions = 0;
    for (const k of Object.keys(this.config.solutions) as (keyof typeof this.config.solutions)[]) {
      if (this.config.solutions[k]) activeSolutions++;
    }
    const effectiveness = clamp(liveFlow * 0.62 + (1 - avgDistress) * 0.38, 0, 1);

    return {
      simTime: this.simTime,
      dayMinutes: this.dayMinutes,
      crowdFactor: this.crowdFactor,
      periodLabel: this.periodLabel,
      totalAgents: this.agents.length,
      inTransit,
      atRestroom,
      atFood,
      atShop,
      atParking,
      resting,
      inQueue,
      arrived: this.arrived,
      departed: this.departed,
      lostNow,
      lostEventsTotal: this.lostEventsTotal,
      firstTrySuccess,
      liveFlow,
      avgDetour,
      avgTimeLost,
      avgDistress,
      worstNodeId,
      worstNodeHeat,
      causeCounts: { ...this.causeCounts },
      hotspots,
      askedTotal: this.askedTotal,
      giveUpTotal: this.giveUpTotal,
      activeSolutions,
      costIndex: this.costIndex(),
      effectiveness,
      volunteersActive: this.volunteersBusy,
      digitalUsers,
      lineUsers,
    };
  }
}
