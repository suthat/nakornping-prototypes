import {
  BUILDING_RESTROOM,
  CAFETERIA_ID,
  CASHIER_ID,
  findPath,
  hostBuildingForRestroom,
  isRestroomZone,
  PHARMACY_ID,
  pointOnSegment,
  RECEPTION_ID,
  RESTROOM_ID,
  RESTROOM_ZONE_IDS,
  restroomForZone,
  segmentDistance,
  easeInOutCubic,
  TB_CLINIC_ID,
  TB_SUBZONES,
  TRANSIT_PACE,
  WALKWAY_ID,
  WALK_SPEED,
  ZONES,
  zoneCenter,
} from "./layout";
import {
  AgentSnapshot,
  HealthStatus,
  LifeActivity,
  PersonKind,
  ScreeningStage,
  SimConfig,
  SimStats,
  WEATHER,
  WeatherProfile,
  ZoneSnapshot,
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

const START_HOUR = 7;
const DAY_MIN_PER_SEC = 2; // 1 วิ sim ≈ 2 นาทีจริง
const BREATH_RATE = 1.05; // m³/h สัมพัทธ์
const INFECTION_THRESHOLD = 1.35; // dose ที่เริ่มมีโอกาสติด
const EXPOSED_THRESHOLD = 0.22;
const QUANTA_DECAY = 0.042; // ช้าลง = quanta คงในอากาศนานขึ้น
const ZONED_TB_EXPOSURE = 0.34; // แบ่งโzoน TB ยังมี leakage
const INFECTION_PROB_SCALE = 0.48;
const ACTIVE_TB_SHED = 0.28; // active ใน รพ. → quanta คงในคลินิก TB
const HOSPITAL_RATE_WINDOW_MIN = 120; // หน้าต่างสถิติ (นาที โรงพยาบาล)
const TRANSIT_EXPOSURE_MULT = 0.35;
const OPD_MIN_SCREENING_QUEUE = 8;
/** active ยังไม่ IDEN ที่ OPD — แพร่เชื้อในห้องรอคัดกรอง */
const OPD_UNIDENTIFIED_SHED = 2.4;
/** resuspension จากคิวรอ IDEN แน่น */
const OPD_QUEUE_RESUSP = 0.62;
/** quanta พื้นฐานจากกิจกรรมคัดกรอง OPD (รอ/เดิน/เรียกคิว) */
const OPD_SCREENING_BASE = 0.42;
const RESTROOM_RESUSPENSION = 2.1; // aerosol จาก flush/พื้นที่แคบ
/** โรงอาหาร — คุย/กิน resuspend quanta ที่มีอยู่ */
const CAFETERIA_RESUSPENSION = 1.38;
/** quanta พื้นฐานจากคนแน่นในโรงอาหาร (โดยเฉพาะช่วงเที่ยง) */
const CAFETERIA_CROWD_SHED = 0.32;
const HUB_ZONES = [
  RECEPTION_ID,
  PHARMACY_ID,
  CASHIER_ID,
  CAFETERIA_ID,
  WALKWAY_ID,
] as const;

interface Agent {
  id: number;
  kind: PersonKind;
  status: HealthStatus;
  zoneId: number;
  /** subzone ในคลินิก TB */
  subzone: "active" | "non_active" | "family" | null;
  path: number[];
  pathIdx: number;
  moveT: number;
  dwellLeft: number;
  exposure: number;
  identified: boolean;
  /** ติดเชื้อระหว่างเดินทาง */
  transitInfected: boolean;
  scheduleIdx: number;
  /** มาจากเส้นทาง OPD screening */
  viaOpd: boolean;
  /** เที่ยวที่เหลือ (visitor) — 0 = กำลังออกจาก รพ. */
  tripsLeft: number;
  /** ไปโรงอาหารแล้วในรอบนี้ */
  ateLunch: boolean;
  /** กิจกรรมชีวิตปัจจุบัน */
  activity: LifeActivity;
  /** ผู้ป่วย OPD ทั่วไป (ไม่เข้าเส้นทาง TB) */
  opdRegular: boolean;
  /** กำลังออกจาก รพ. / กลับบ้าน */
  discharging: boolean;
}

interface ZoneAir {
  quanta: number;
  riskHist: number[];
}

export class Simulation {
  config: SimConfig;
  rand: () => number;

  simTime = 0;
  dayMinutes = START_HOUR * 60;
  agents: Agent[] = [];
  zoneAir: ZoneAir[] = [];
  zoneInfections: number[] = [];
  private nextId = 1;
  private infectionEvents: number[] = [];
  private activeCrossings = 0;
  private transitInfections = 0;
  private infectedInClinic = 0;
  private infectedOutside = 0;
  private visitorAccum = 0;
  private opdAccum = 0;
  private opdGeneralAccum = 0;

  constructor(config: SimConfig, seed = 54321) {
    this.config = { ...config };
    this.rand = mulberry32(seed);
    this.reset(config, seed);
  }

  reset(config: SimConfig, seed = 54321) {
    this.config = { ...config };
    this.rand = mulberry32(seed);
    this.simTime = 0;
    this.dayMinutes = START_HOUR * 60;
    this.agents = [];
    this.zoneAir = ZONES.map(() => ({ quanta: 0, riskHist: [] }));
    this.zoneInfections = ZONES.map(() => 0);
    this.nextId = 1;
    this.infectionEvents = [];
    this.activeCrossings = 0;
    this.transitInfections = 0;
    this.infectedInClinic = 0;
    this.infectedOutside = 0;
    this.visitorAccum = 0;
    this.opdAccum = 0;
    this.opdGeneralAccum = 0;
    this.spawnInitialAgents();
  }

  applyConfig(config: SimConfig) {
    const scenarioChanged =
      config.scenario !== this.config.scenario ||
      config.zoning !== this.config.zoning ||
      config.opdScreening !== this.config.opdScreening ||
      config.numActive !== this.config.numActive ||
      config.numNonActive !== this.config.numNonActive ||
      config.numFamily !== this.config.numFamily;
    this.config = { ...config };
    if (scenarioChanged) this.reset(config);
  }

  get weather(): WeatherProfile {
    return WEATHER[this.config.weather] ?? WEATHER.clear;
  }

  /** ตัวคูณความหนาแน่นคนตามช่วงเวลา */
  get crowdFactor(): number {
    if (!this.config.timeOfDay) return 1;
    const m = this.dayMinutes;
    const morning = gaussian(m, 8.25 * 60, 40);
    const lunch = this.config.lunchMovement ? gaussian(m, 12.25 * 60, 35) : 0;
    const evening = gaussian(m, 16.5 * 60, 45);
    return (0.55 + 2.4 * morning + 1.6 * lunch + 1.1 * evening) * this.weather.crowdMult;
  }

  get periodLabel(): string {
    if (!this.config.timeOfDay) return "คงที่";
    const m = this.dayMinutes;
    const morning = gaussian(m, 8.25 * 60, 40);
    const lunch = gaussian(m, 12.25 * 60, 35);
    if (morning > 0.55) return "เช้า — คนแน่น";
    if (lunch > 0.5) return "เที่ยง — ออกกินข้าว";
    if (this.crowdFactor < 0.55) return "ช่วงเงียบ";
    return "ช่วงปกติ";
  }

  /** 0..1 ความหนาแน่นช่วงเที่ยง */
  private lunchFactor(): number {
    if (!this.config.lunchMovement || !this.config.timeOfDay) return 0;
    return gaussian(this.dayMinutes, 12.25 * 60, 38);
  }

  private visitorCount(): number {
    return this.agents.filter((a) => a.kind === "visitor").length;
  }

  private atCrowdCap(): boolean {
    return this.agents.length >= this.config.maxCrowd;
  }

  /** จำนวน visitor สูงสุด — จองที่ให้คลินิก TB / ญาติ / คัดกรอง */
  private maxVisitors(): number {
    const cfg = this.config;
    const reserved = cfg.numActive + cfg.numNonActive + cfg.numFamily + 50;
    return Math.max(120, cfg.maxCrowd - reserved);
  }

  private maxOpdRegular(): number {
    return Math.round(this.config.maxCrowd * 0.48);
  }

  private minScreeningQueue(): number {
    return Math.max(
      OPD_MIN_SCREENING_QUEUE,
      Math.round(this.config.opdArrivalRate * 0.18)
    );
  }

  private pickHubZone(exclude: number, lunchBias = 0, restroomBias = 0.18): number {
    const opdBoost =
      (this.config.opdScreening ? 2.8 : 0) +
      Math.min(this.config.opdGeneralRate / 80, 4.5);
    const weights = HUB_ZONES.map((z) => {
      if (z === exclude) return 0;
      let w = z === RECEPTION_ID ? 2.2 + opdBoost : z === WALKWAY_ID ? 1.4 : 1.6;
      if (z === CAFETERIA_ID) w += lunchBias * 4;
      return w;
    });
    let total = 0;
    for (const w of weights) total += w;
    let r = this.rand() * total;
    for (let i = 0; i < HUB_ZONES.length; i++) {
      r -= weights[i];
      if (r <= 0) return HUB_ZONES[i];
    }
    return HUB_ZONES[0];
  }

  /** สุ่มห้องน้ำใกล้โzoนปัจจุบัน */
  private pickRestroom(agent: Agent): number {
    const primary = restroomForZone(agent.zoneId);
    if (this.rand() < 0.82) return primary;
    const wcId = RESTROOM_ZONE_IDS[Math.floor(this.rand() * RESTROOM_ZONE_IDS.length)];
    return wcId;
  }

  private maybeRestroom(agent: Agent, probability: number): number | null {
    if (isRestroomZone(agent.zoneId)) return null;
    if (this.rand() < probability) return this.pickRestroom(agent);
    return null;
  }

  private spawnInitialAgents() {
    const cfg = this.config;
    for (let i = 0; i < cfg.numActive; i++) {
      this.addAgent("active", TB_CLINIC_ID, true);
    }
    for (let i = 0; i < cfg.numNonActive; i++) {
      this.addAgent("non_active", TB_CLINIC_ID, true);
    }
    for (let i = 0; i < cfg.numFamily; i++) {
      this.addAgent("family", TB_CLINIC_ID, true);
    }

    if (cfg.opdGeneralRate > 0) {
      const regularN = Math.max(35, Math.round(cfg.opdGeneralRate * 0.42));
      for (let i = 0; i < regularN && this.agents.length < cfg.maxCrowd; i++) {
        this.addOpdRegular();
      }
    }

    if (cfg.opdScreening) {
      const screenN = Math.max(12, Math.round(cfg.opdArrivalRate * 0.85));
      for (let i = 0; i < screenN && this.agents.length < cfg.maxCrowd; i++) {
        const hiddenActive = this.rand() < cfg.unknownActiveRatio;
        this.addAgent(
          hiddenActive ? "active" : "non_active",
          RECEPTION_ID,
          false,
          true
        );
      }
    }

    if (cfg.ambientCrowd) {
      const n = Math.max(45, Math.round(cfg.visitorRate * 1.15));
      for (let i = 0; i < n && this.agents.length < cfg.maxCrowd; i++) {
        const zi = HUB_ZONES[Math.floor(this.rand() * HUB_ZONES.length)];
        const v = this.addVisitor(zi);
        if (this.rand() < 0.5) {
          const dest = this.pickLifeDestination(v);
          if (dest != null && dest !== v.zoneId) this.startMove(v, dest);
        }
      }
    }
  }

  private activityFromZone(zoneId: number): LifeActivity {
    switch (ZONES[zoneId].kind) {
      case "cafeteria":
        return "eating";
      case "restroom":
        return "restroom";
      case "pharmacy":
        return "pharmacy";
      case "cashier":
        return "paying";
      case "reception":
        return "opd";
      case "walkway":
        return "waiting";
      default:
        return "idle";
    }
  }

  private applyArrivalDwell(agent: Agent) {
    if (agent.discharging) {
      agent.activity = "leaving";
      agent.dwellLeft = 3 + this.rand() * 8;
      return;
    }
    agent.activity = this.activityFromZone(agent.zoneId);
    const ranges: Record<LifeActivity, [number, number]> = {
      idle: [55, 110],
      transit: [0, 0],
      eating: [150, 260],
      restroom: [60, 110],
      pharmacy: [95, 170],
      paying: [75, 130],
      waiting: [35, 70],
      opd: [85, 155],
      leaving: [12, 28],
    };
    const [lo, hi] = ranges[agent.activity];
    agent.dwellLeft = lo + this.rand() * (hi - lo);
    if (agent.kind === "visitor") {
      agent.dwellLeft *= agent.activity === "eating" ? 0.85 : 0.72;
    }
    if (agent.zoneId === WALKWAY_ID) {
      agent.dwellLeft = 14 + this.rand() * 22;
      agent.activity = "waiting";
    }
  }

  /** ปลายทางสำหรับผู้ป่วย OPD ทั่วไป — วนอยู่ใน OPD/ใกล้เคียง ไม่ไป TB */
  private pickOpdRegularDestination(agent: Agent): number | null {
    const z = agent.zoneId;
    const lf = this.lunchFactor();
    if (agent.tripsLeft <= 0) {
      return z === RECEPTION_ID ? null : RECEPTION_ID;
    }
    const wc = this.maybeRestroom(agent, 0.16);
    if (wc != null) return wc;
    if (
      this.config.lunchMovement &&
      lf > 0.2 &&
      !agent.ateLunch &&
      z !== CAFETERIA_ID &&
      this.rand() < 0.25 + lf * 0.35
    ) {
      return CAFETERIA_ID;
    }
    const hubs = [RECEPTION_ID, PHARMACY_ID, CASHIER_ID] as const;
    const weights = hubs.map((hid) => {
      if (hid === z) return 0.4;
      if (hid === RECEPTION_ID) return 3.2;
      return 1.5;
    });
    let total = 0;
    for (const w of weights) total += w;
    let r = this.rand() * total;
    for (let i = 0; i < hubs.length; i++) {
      r -= weights[i];
      if (r <= 0) return hubs[i];
    }
    return RECEPTION_ID;
  }

  private addOpdRegular(zoneId = RECEPTION_ID): Agent {
    const a = this.addAgent("visitor", zoneId, true);
    a.opdRegular = true;
    a.tripsLeft = 10 + Math.floor(this.rand() * 12);
    a.dwellLeft = 35 + this.rand() * 75;
    a.activity = "opd";
    return a;
  }

  private opdRegularCount(): number {
    return this.agents.filter((a) => a.opdRegular).length;
  }

  private screeningStageFor(a: Agent): ScreeningStage {
    if (!a.viaOpd) return "none";
    if (a.path.length > 0) {
      const dest = a.path[a.path.length - 1];
      if (dest === TB_CLINIC_ID) return "to_tb";
    }
    if (!a.identified && a.zoneId === RECEPTION_ID && a.path.length === 0) {
      return "waiting_iden";
    }
    if (a.identified && a.zoneId === RECEPTION_ID && a.path.length === 0) {
      return "iden_done";
    }
    return "none";
  }

  /** ปลายทางกิจกรรมชีวิตทั่วไป (visitor / ญาติ / คนเดินทั่วไป) */
  private pickLifeDestination(agent: Agent): number | null {
    const lf = this.lunchFactor();
    const z = agent.zoneId;

    if (agent.kind === "visitor" && agent.tripsLeft <= 0) {
      return z === RECEPTION_ID ? null : RECEPTION_ID;
    }

    const wc = this.maybeRestroom(agent, 0.22);
    if (wc != null) return wc;

    if (
      this.config.lunchMovement &&
      lf > 0.15 &&
      !agent.ateLunch &&
      z !== CAFETERIA_ID
    ) {
      if (this.rand() < 0.38 + lf * 0.48) return CAFETERIA_ID;
    }

    return this.pickHubZone(z, lf);
  }

  private subzoneFor(kind: PersonKind): Agent["subzone"] {
    if (this.config.zoning !== "zoned") return null;
    if (kind === "active") return "active";
    if (kind === "family") return "family";
    if (kind === "non_active") return "non_active";
    return null;
  }

  private addAgent(
    kind: PersonKind,
    zoneId: number,
    identified: boolean,
    viaOpd = false
  ): Agent {
    const a: Agent = {
      id: this.nextId++,
      kind,
      status: kind === "active" ? "infected" : "susceptible",
      zoneId,
      subzone: zoneId === TB_CLINIC_ID ? this.subzoneFor(kind) : null,
      path: [],
      pathIdx: 0,
      moveT: 0,
      dwellLeft: viaOpd
        ? 130 + this.rand() * 210
        : 30 + this.rand() * 60,
      exposure: 0,
      identified,
      transitInfected: false,
      scheduleIdx: 0,
      viaOpd,
      tripsLeft: kind === "visitor" ? 0 : -1,
      ateLunch: false,
      activity: viaOpd ? "opd" : "idle",
      opdRegular: false,
      discharging: false,
    };
    this.agents.push(a);
    return a;
  }

  private addVisitor(zoneId: number): Agent {
    const a = this.addAgent("visitor", zoneId, true);
    a.tripsLeft = 6 + Math.floor(this.rand() * 10);
    a.dwellLeft = 10 + this.rand() * 22;
    a.activity = this.activityFromZone(zoneId);
    return a;
  }

  /** คนที่ควรออกจาก รพ. ได้ (ไม่รวมผู้ป่วย TB ในคลินิก / active index) */
  private canLeaveHospital(a: Agent): boolean {
    if (a.kind === "active" || a.kind === "non_active") return false;
    if (a.viaOpd && !a.identified) return false;
    return a.kind === "visitor" || a.opdRegular || a.kind === "family";
  }

  /** ส่งต่อ/แยกโรcis — ผู้ป่วย non-active ที่ติดเชืoroรอง */
  private scheduleIsolation(a: Agent) {
    if (a.kind !== "non_active" || a.discharging) return;
    a.discharging = true;
    a.dwellLeft = Math.min(a.dwellLeft, 10 + this.rand() * 22);
    a.activity = "leaving";
  }

  /** ตั้งให้ออกจาก รพ. — หลังติดเชื้อหรือครบเวลาเยี่ยม */
  private scheduleDischarge(a: Agent, urgent = false) {
    if (!this.canLeaveHospital(a)) return;
    if (a.discharging) return;
    a.discharging = true;
    a.tripsLeft = 0;
    a.dwellLeft = urgent ? 4 + this.rand() * 12 : 10 + this.rand() * 28;
    a.activity = "leaving";
    if (a.path.length === 0) {
      const dest = this.exitDestination(a);
      if (dest != null && dest !== a.zoneId) this.startMove(a, dest);
    }
  }

  /** ปลายทางทางออก — OPD / ทางเดินกลางแจ้ง */
  private exitDestination(agent: Agent): number | null {
    if (agent.path.length > 0) return null;
    if (agent.zoneId === WALKWAY_ID) {
      agent.dwellLeft = Math.min(agent.dwellLeft, 6 + this.rand() * 14);
      return null;
    }
    if (agent.zoneId === RECEPTION_ID) return WALKWAY_ID;
    const toWalk = findPath(agent.zoneId, WALKWAY_ID);
    if (toWalk.length >= 2) return WALKWAY_ID;
    return RECEPTION_ID;
  }

  /** สัดส่วนทยอยกลับบ้าน + ผลักผู้ติดเชืoroออก */
  private processGradualDepartures(dt: number) {
    for (const a of this.agents) {
      if (!this.canLeaveHospital(a) || a.path.length > 0) continue;

      if (a.status === "infected" && !a.discharging) {
        this.scheduleDischarge(a, true);
        continue;
      }

      if (a.discharging) continue;

      let rate = 0;
      if (a.opdRegular) {
        rate = a.tripsLeft <= 0 ? 0.06 : a.tripsLeft <= 2 ? 0.022 : 0.005;
      } else if (a.kind === "visitor") {
        rate = a.tripsLeft <= 0 ? 0.048 : a.tripsLeft <= 2 ? 0.018 : 0.004;
      } else if (a.kind === "family") {
        rate = a.dwellLeft < 0 ? 0.01 : 0.0025;
      }
      if (a.status === "exposed") rate *= 1.5;
      if (a.dwellLeft < -240) rate *= 2;

      if (this.rand() < rate * dt * 0.18) {
        this.scheduleDischarge(a);
      }
    }
  }

  /** กำหนดปลายทางถัดไปตาม scenario + ช่วงเวลา */
  private planNextDestination(agent: Agent): number | null {
    if (agent.discharging) {
      return this.exitDestination(agent);
    }

    const s = this.config.scenario;
    const cfg = this.config;
    const lf = this.lunchFactor();

    if (isRestroomZone(agent.zoneId)) {
      const host = hostBuildingForRestroom(agent.zoneId);
      if (host != null) return host;
    }

    if (agent.opdRegular && cfg.opdScreening && !agent.discharging) {
      return this.pickOpdRegularDestination(agent);
    }

    // OPD screening: ยังรอ IDEN อยู่ที่ OPD
    if (cfg.opdScreening && agent.viaOpd && !agent.identified) {
      return null;
    }
    // ผ่าน IDEN แล้ว — ส่งจาก OPD ไป TB
    if (
      cfg.opdScreening &&
      agent.viaOpd &&
      agent.identified &&
      agent.zoneId === RECEPTION_ID
    ) {
      return TB_CLINIC_ID;
    }

    if (s === "fast_track") {
      if (agent.zoneId !== TB_CLINIC_ID) return TB_CLINIC_ID;
      return null;
    }

    if (s === "active_no_move") {
      if (agent.kind === "active" && agent.zoneId !== TB_CLINIC_ID) {
        return TB_CLINIC_ID;
      }
      return null;
    }

    // active_move — active ที่ทราบสถานะแล้ว (รวมที่ IDEN จาก OPD)
    if (agent.kind === "active" && agent.identified) {
      const wc = this.maybeRestroom(agent, 0.14);
      if (wc != null) return wc;

      // ช่วงเที่ยง — ลำดับความสำคัญโรงอาหาร
      if (cfg.lunchMovement && lf > 0.28 && !agent.ateLunch) {
        if (agent.zoneId === CAFETERIA_ID) {
          agent.ateLunch = true;
          return TB_CLINIC_ID;
        }
        if (agent.zoneId !== CAFETERIA_ID && this.rand() < 0.55 + lf * 0.4) {
          return CAFETERIA_ID;
        }
      }

      if (agent.zoneId === TB_CLINIC_ID) {
        if (agent.scheduleIdx % 2 === 0) return PHARMACY_ID;
        return CASHIER_ID;
      }
      if (agent.zoneId === PHARMACY_ID) return CASHIER_ID;
      if (agent.zoneId === CASHIER_ID) {
        if (cfg.lunchMovement && lf > 0.25 && !agent.ateLunch && this.rand() < 0.65) {
          return CAFETERIA_ID;
        }
        return TB_CLINIC_ID;
      }
      if (agent.zoneId === CAFETERIA_ID) {
        agent.ateLunch = true;
        return TB_CLINIC_ID;
      }
      if (isRestroomZone(agent.zoneId)) return TB_CLINIC_ID;
      return TB_CLINIC_ID;
    }

    // ญาติ — เดินไปมา + ไปกินข้าว/ห้องน้ำ
    if (agent.kind === "family") {
      const wc = this.maybeRestroom(agent, 0.18);
      if (wc != null) return wc;
      if (cfg.lunchMovement && lf > 0.3) {
        if (agent.zoneId === CAFETERIA_ID) return TB_CLINIC_ID;
        if (agent.zoneId === TB_CLINIC_ID && !agent.ateLunch && this.rand() < 0.6 + lf * 0.3) {
          return CAFETERIA_ID;
        }
      }
      if (s === "active_move") {
        const activeMoving = this.agents.some(
          (a) => a.kind === "active" && a.path.length > 0
        );
        if (activeMoving && this.rand() < 0.28) {
          return this.pickHubZone(agent.zoneId, lf * 0.5);
        }
        if (this.rand() < 0.2) return this.pickLifeDestination(agent);
      }
      return null;
    }

    // non-active ในคลินิก — บางครั้งออกไปกินข้าว/ห้องน้ำ
    if (agent.kind === "non_active" && cfg.ambientCrowd && s === "active_move") {
      if (agent.zoneId === TB_CLINIC_ID && this.rand() < 0.16) {
        return this.pickLifeDestination(agent);
      }
      if (agent.zoneId !== TB_CLINIC_ID) return TB_CLINIC_ID;
    }

    // visitor / ambient foot traffic — เดินไปมาตลอด
    if (agent.kind === "visitor" && cfg.ambientCrowd) {
      return this.pickLifeDestination(agent);
    }

    return null;
  }

  private startMove(agent: Agent, dest: number) {
    const path = findPath(agent.zoneId, dest);
    if (path.length < 2) {
      agent.zoneId = dest;
      this.applyArrivalDwell(agent);
      return;
    }
    agent.path = path;
    agent.pathIdx = 0;
    agent.moveT = 0;
    agent.activity = "transit";
    if (agent.kind === "active") this.activeCrossings++;
  }

  private walkSpeed(agent: Agent): number {
    if (agent.kind === "active") return WALK_SPEED.active;
    if (agent.kind === "family") return WALK_SPEED.family;
    return WALK_SPEED.default;
  }

  private effectiveVentilation(zoneId: number): number {
    const z = ZONES[zoneId];
    let v = z.ventilation;
    if (z.kind === "walkway") v *= this.weather.outdoorVentMult;
    return v;
  }

  private isInfectious(agent: Agent): boolean {
    return agent.kind === "active" || agent.status === "infected";
  }

  /** อัปเดตความเข้ม quanta ในแต่ละโซน (Wells-Riley แบบ compartment) */
  private updateZoneAir(dt: number) {
    const cfg = this.config;
    const dtHours = dt / 3600;

    for (let zi = 0; zi < ZONES.length; zi++) {
      const air = this.zoneAir[zi];
      const vent = this.effectiveVentilation(zi);
      const decay = Math.exp(-vent * dtHours * QUANTA_DECAY);

      let emission = 0;
      let occupants = 0;
      for (const a of this.agents) {
        if (a.zoneId !== zi || a.path.length > 0) continue;
        occupants++;
        if (this.isInfectious(a)) {
          let q = cfg.quantaRate;
          // แบ่งโซน: ลดการปนในคลินิก TB
          if (
            zi === TB_CLINIC_ID &&
            cfg.zoning === "zoned" &&
            a.subzone &&
            a.kind !== "active"
          ) {
            q *= 0.08;
          }
          if (ZONES[zi].kind === "restroom") {
            q *= RESTROOM_RESUSPENSION;
          }
          if (ZONES[zi].kind === "cafeteria") {
            q *= CAFETERIA_RESUSPENSION;
          }
          if (
            cfg.opdScreening &&
            zi === RECEPTION_ID &&
            a.viaOpd &&
            !a.identified &&
            a.kind === "active"
          ) {
            q *= OPD_UNIDENTIFIED_SHED;
          }
          emission += q;
        }
      }

      const zone = ZONES[zi];
      let crowdBoost = 1 + Math.min(occupants * 0.04, 0.6) * this.crowdFactor;
      if (zone.kind === "restroom") {
        crowdBoost *= zone.crowdingMult ?? 2.4;
      }
      if (zone.kind === "cafeteria") {
        crowdBoost *= zone.crowdingMult ?? 2.05;
      }
      if (cfg.opdScreening && zi === RECEPTION_ID) {
        crowdBoost *= 1 + Math.min(occupants * 0.028, 0.5);
      }

      air.quanta = air.quanta * decay + emission * dtHours * crowdBoost;

      if (cfg.opdScreening && zi === RECEPTION_ID) {
        let waiting = 0;
        let hiddenActive = 0;
        for (const a of this.agents) {
          if (a.zoneId !== RECEPTION_ID || a.path.length > 0) continue;
          if (a.viaOpd && !a.identified) {
            waiting++;
            if (a.kind === "active") hiddenActive++;
          }
        }
        if (hiddenActive > 0 && waiting >= 2) {
          air.quanta +=
            hiddenActive *
            cfg.quantaRate *
            OPD_QUEUE_RESUSP *
            Math.sqrt(waiting) *
            dtHours *
            crowdBoost;
        }
        if (waiting > 0) {
          air.quanta +=
            cfg.quantaRate *
            OPD_SCREENING_BASE *
            Math.min(waiting / 4, 2.5) *
            dtHours *
            crowdBoost;
        }
      }

      if (zone.kind === "cafeteria" && occupants >= 4) {
        const lf = this.lunchFactor();
        const lunchMult = cfg.lunchMovement ? 0.5 + lf * 1.25 : 0.7;
        air.quanta +=
          cfg.quantaRate *
          CAFETERIA_CROWD_SHED *
          Math.sqrt(occupants) *
          lunchMult *
          dtHours *
          crowdBoost;
      }

      // active ใน รพ. → shedding คงที่ในคลินิก TB (HVAC / การเคลื่อนที่วนกลับ)
      if (zi === TB_CLINIC_ID) {
        const actives = this.agents.filter((a) => a.kind === "active").length;
        if (actives > 0) {
          air.quanta += actives * cfg.quantaRate * ACTIVE_TB_SHED * dtHours;
        }
      }
      const norm = air.quanta / (ZONES[zi].volume * vent * 0.05 + 0.01);
      air.riskHist.push(norm);
      if (air.riskHist.length > 30) air.riskHist.shift();
    }
  }

  /** สัมผัส quanta ในโซน */
  private applyZoneExposure(dt: number) {
    const dtHours = dt / 3600;
    const cfg = this.config;

    for (const a of this.agents) {
      if (a.status === "infected" || a.kind === "active") continue;
      if (a.path.length > 0) continue;

      const air = this.zoneAir[a.zoneId];
      const zone = ZONES[a.zoneId];
      let conc = air.quanta;

      // แบ่งโซน TB: ลด exposure ถ้าอยู่คนละ subzone กับ active
      if (
        a.zoneId === TB_CLINIC_ID &&
        cfg.zoning === "zoned" &&
        a.subzone &&
        a.subzone !== "active"
      ) {
        conc *= ZONED_TB_EXPOSURE;
      }

      let dose = conc * BREATH_RATE * dtHours * cfg.susceptibility;
      if (zone.kind === "restroom") {
        dose *= zone.riskMultiplier ?? 2.1;
      }
      if (zone.kind === "cafeteria") {
        dose *= zone.riskMultiplier ?? 1.55;
      }
      a.exposure += dose;

      if (a.exposure > EXPOSED_THRESHOLD && a.status === "susceptible") {
        a.status = "exposed";
      }

      if (a.exposure >= INFECTION_THRESHOLD) {
        const p = 1 - Math.exp(-(a.exposure - INFECTION_THRESHOLD) * 0.55);
        if (this.rand() < p * dt * INFECTION_PROB_SCALE) {
          a.status = "infected";
          this.zoneInfections[a.zoneId]++;
          this.infectionEvents.push(this.simTime);
          if (a.zoneId === TB_CLINIC_ID) this.infectedInClinic++;
          else this.infectedOutside++;
          if (a.kind === "non_active") this.scheduleIsolation(a);
          else this.scheduleDischarge(a, true);
        }
      }
    }
  }

  /** exposure ระหว่างเดินทาง — ผสม quanta จากโซนต้นทาง/ปลายทาง + walkway */
  private applyTransitExposure(agent: Agent, dt: number) {
    if (agent.status === "infected" || agent.kind === "active") return;
    const dtHours = dt / 3600;
    const from = agent.path[agent.pathIdx];
    const to = agent.path[agent.pathIdx + 1];
    if (to == null) return;

    const qFrom = this.zoneAir[from].quanta;
    const qTo = this.zoneAir[to].quanta;
    const qWalk = this.zoneAir[WALKWAY_ID].quanta;
    let conc =
      (qFrom + qTo) * 0.35 +
      qWalk * 0.3 +
      this.crowdFactor * 0.08;
    if (isRestroomZone(from) || isRestroomZone(to)) {
      conc *= 1.65;
    }

    const dose =
      conc *
      BREATH_RATE *
      dtHours *
      TRANSIT_EXPOSURE_MULT *
      this.config.susceptibility;
    agent.exposure += dose;

    if (agent.exposure > EXPOSED_THRESHOLD && agent.status === "susceptible") {
      agent.status = "exposed";
    }
    if (agent.exposure >= INFECTION_THRESHOLD * 0.9) {
      const p = 1 - Math.exp(-(agent.exposure - INFECTION_THRESHOLD * 0.9) * 0.65);
      if (this.rand() < p * dt * INFECTION_PROB_SCALE * 1.15) {
        agent.status = "infected";
        agent.transitInfected = true;
        this.transitInfections++;
        this.infectionEvents.push(this.simTime);
        this.infectedOutside++;
        this.scheduleDischarge(agent, true);
      }
    }
  }

  /** ปล่อย quanta ลง walkway ขณะ active เดินทาง */
  private emitTransitQuanta(agent: Agent, dt: number) {
    if (!this.isInfectious(agent)) return;
    const dtHours = dt / 3600;
    const cfg = this.config;
    const rainDamp = 1 + (this.weather.outdoorVentMult - 1) * 0.3;
    this.zoneAir[WALKWAY_ID].quanta +=
      cfg.quantaRate * dtHours * 3.2 * rainDamp;
    // ปล่อย quanta ลงโzoนที่ active กำลังผ่านด้วย
    if (agent.path.length > 0) {
      const from = agent.path[agent.pathIdx];
      const to = agent.path[agent.pathIdx + 1];
      if (from != null) {
        this.zoneAir[from].quanta += cfg.quantaRate * dtHours * 1.4 * rainDamp;
      }
      if (to != null) {
        this.zoneAir[to].quanta += cfg.quantaRate * dtHours * 0.9 * rainDamp;
      }
    }
  }

  private spawnVisitors(dt: number) {
    if (!this.config.ambientCrowd) return;
    if (this.atCrowdCap()) return;
    if (this.visitorCount() >= this.maxVisitors()) return;

    const lf = this.lunchFactor();
    const rate =
      this.config.visitorRate *
      this.crowdFactor *
      this.weather.crowdMult *
      (1 + lf * 0.5);
    this.visitorAccum += (rate / 3600) * dt;
    while (
      this.visitorAccum >= 1 &&
      !this.atCrowdCap() &&
      this.visitorCount() < this.maxVisitors()
    ) {
      this.visitorAccum -= 1;
      const lfNow = this.lunchFactor();
      let zi = RECEPTION_ID;
      if (this.rand() < 0.55 + lfNow * 0.35) {
        zi = this.pickHubZone(-1, lfNow);
      } else {
        const zones = [...HUB_ZONES];
        const weights = zones.map((z) =>
          z === CAFETERIA_ID ? 1.2 + lfNow * 3 : z === RECEPTION_ID ? 3 : 1.5
        );
        let total = 0;
        for (const w of weights) total += w;
        let r = this.rand() * total;
        for (let i = 0; i < zones.length; i++) {
          r -= weights[i];
          if (r <= 0) {
            zi = zones[i];
            break;
          }
        }
      }

      if (
        zi === RECEPTION_ID &&
        this.opdRegularCount() < this.maxOpdRegular() &&
        this.rand() < 0.78
      ) {
        const r = this.addOpdRegular(RECEPTION_ID);
        if (this.rand() < 0.3) {
          const dest = this.pickOpdRegularDestination(r);
          if (dest != null && dest !== r.zoneId) this.startMove(r, dest);
        }
        continue;
      }

      if (
        zi === RECEPTION_ID &&
        this.config.opdScreening &&
        this.rand() < this.config.unknownActiveRatio * 0.6
      ) {
        this.addAgent("active", RECEPTION_ID, false, true);
        continue;
      }

      this.addVisitor(zi);
      const last = this.agents[this.agents.length - 1];
      if (last?.kind === "visitor" && this.rand() < 0.42) {
        const dest = this.pickLifeDestination(last);
        if (dest != null && dest !== last.zoneId) this.startMove(last, dest);
      }
    }

    this.pruneDeparted();
  }

  private pruneDeparted() {
    this.agents = this.agents.filter((a) => {
      if (a.kind === "active") return true;

      if (a.kind === "non_active") {
        return !(a.discharging && a.dwellLeft <= 0);
      }

      if (a.discharging) {
        if (a.path.length > 0) return true;
        if (
          a.dwellLeft <= 0 &&
          (a.zoneId === WALKWAY_ID || a.zoneId === RECEPTION_ID)
        ) {
          return false;
        }
        if (a.dwellLeft <= -40) return false;
        return true;
      }

      if (a.opdRegular) {
        return (
          a.tripsLeft > 0 ||
          a.dwellLeft > -90 ||
          a.zoneId !== RECEPTION_ID ||
          a.path.length > 0
        );
      }

      if (a.kind !== "visitor") return true;

      if (
        a.tripsLeft <= 0 &&
        a.zoneId === RECEPTION_ID &&
        a.path.length === 0 &&
        a.dwellLeft < -20
      ) {
        return false;
      }
      return a.tripsLeft > 0 || a.dwellLeft > -360;
    });
  }

  /** กระแสผู้ป่วย OPD ทั่วไป — ให้ OPD คนแน่นตลอด */
  private spawnOpdGeneralCrowd(dt: number) {
    if (this.config.opdGeneralRate <= 0) return;
    if (this.atCrowdCap()) return;
    const cap = this.maxOpdRegular();
    if (this.opdRegularCount() >= cap) return;

    const rate =
      this.config.opdGeneralRate * this.crowdFactor * this.weather.crowdMult;
    this.opdGeneralAccum += (rate / 3600) * dt;
    while (
      this.opdGeneralAccum >= 1 &&
      !this.atCrowdCap() &&
      this.opdRegularCount() < cap
    ) {
      this.opdGeneralAccum -= 1;
      const a = this.addOpdRegular();
      if (this.rand() < 0.35) {
        const dest = this.pickOpdRegularDestination(a);
        if (dest != null && dest !== a.zoneId) this.startMove(a, dest);
      }
    }
  }

  /** กระแสผู้มา OPD เพื่อคัดกรองโดยเฉพาะ */
  private spawnOpdArrivals(dt: number) {
    if (!this.config.opdScreening) return;
    if (this.atCrowdCap()) return;

    const waiting = this.agents.filter(
      (a) =>
        a.viaOpd &&
        !a.identified &&
        a.zoneId === RECEPTION_ID &&
        a.path.length === 0
    ).length;
    if (waiting < this.minScreeningQueue()) {
      if (!this.atCrowdCap()) {
        const hiddenActive = this.rand() < this.config.unknownActiveRatio;
        this.addAgent(
          hiddenActive ? "active" : "non_active",
          RECEPTION_ID,
          false,
          true
        );
      }
    }

    const rate =
      this.config.opdArrivalRate * 1.35 * this.crowdFactor * this.weather.crowdMult;
    this.opdAccum += (rate / 3600) * dt;
    while (this.opdAccum >= 1 && !this.atCrowdCap()) {
      this.opdAccum -= 1;
      const hiddenActive = this.rand() < this.config.unknownActiveRatio;
      this.addAgent(
        hiddenActive ? "active" : "non_active",
        RECEPTION_ID,
        false,
        true
      );
    }
  }

  private updateAgents(dt: number) {
    this.processGradualDepartures(dt);

    for (const a of this.agents) {
      if (a.discharging && a.kind === "non_active") {
        a.dwellLeft -= dt * 3;
        continue;
      }

      if (a.discharging && a.path.length === 0) {
        if (a.zoneId === WALKWAY_ID || a.zoneId === RECEPTION_ID) {
          a.dwellLeft -= dt * 2.5;
          continue;
        }
        const exit = this.exitDestination(a);
        if (exit != null && exit !== a.zoneId) {
          this.startMove(a, exit);
          continue;
        }
        a.dwellLeft -= dt * 2;
      }

      // IDEN ที่ OPD — คัดกรองเสร็จ (ยังแพร่เชื้อระหว่างรอ)
      if (
        this.config.opdScreening &&
        a.viaOpd &&
        !a.identified &&
        a.zoneId === RECEPTION_ID &&
        a.dwellLeft <= 0
      ) {
        a.identified = true;
        a.activity = "opd";
        a.dwellLeft = 32 + this.rand() * 48;
        continue;
      }

      if (a.path.length > 0 && a.pathIdx < a.path.length - 1) {
        const from = a.path[a.pathIdx];
        const to = a.path[a.pathIdx + 1];
        const edgeOutdoor =
          ZONES[from].kind === "walkway" || ZONES[to].kind === "walkway";
        let speed = this.walkSpeed(a);
        if (edgeOutdoor) speed *= this.weather.outdoorMoveMult;

        const dist = segmentDistance(from, to);
        a.moveT += (speed * TRANSIT_PACE * dt) / Math.max(dist, 8);
        this.applyTransitExposure(a, dt);
        if (this.isInfectious(a)) this.emitTransitQuanta(a, dt);

        if (a.moveT >= 1) {
          a.pathIdx++;
          a.moveT = 0;
          if (a.pathIdx >= a.path.length - 1) {
            a.zoneId = a.path[a.path.length - 1];
            a.path = [];
            a.pathIdx = 0;
            a.scheduleIdx++;
            if (a.kind === "visitor" && a.tripsLeft > 0) a.tripsLeft--;
            if (a.zoneId === CAFETERIA_ID) a.ateLunch = true;
            this.applyArrivalDwell(a);
            if (a.discharging && a.path.length === 0) {
              const exit = this.exitDestination(a);
              if (exit != null && exit !== a.zoneId) {
                this.startMove(a, exit);
              }
            }
            if (a.zoneId === TB_CLINIC_ID) {
              a.subzone = this.subzoneFor(a.kind);
            }
            if (this.config.scenario === "fast_track" && a.zoneId === TB_CLINIC_ID) {
              a.identified = true;
            }
          }
        }
        continue;
      }

      a.dwellLeft -= dt;
      if (a.discharging && a.path.length === 0 && a.dwellLeft <= 0) {
        const dest = this.exitDestination(a);
        if (dest != null && dest !== a.zoneId) {
          this.startMove(a, dest);
          continue;
        }
      }
      if (a.dwellLeft <= 0) {
        const dest = this.planNextDestination(a);
        if (dest != null && dest !== a.zoneId) {
          if (this.config.scenario === "fast_track" && a.zoneId === RECEPTION_ID) {
            this.startMove(a, TB_CLINIC_ID);
            a.identified = true;
          } else if (
            this.config.scenario === "active_no_move" &&
            a.kind === "active" &&
            a.identified
          ) {
            a.dwellLeft = 60;
          } else {
            this.startMove(a, dest);
          }
        } else {
          a.dwellLeft = a.discharging ? 2 + this.rand() * 5 : 40 + this.rand() * 70;
        }
      }
    }
  }

  /** ผสม quanta ระหว่างโซนที่เชื่อม (diffusion แบบง่าย) */
  private diffuseQuanta(dt: number) {
    const dtH = dt / 3600;
    const mixing = 0.028 * dtH;
    const pairs: [number, number][] = [
      [TB_CLINIC_ID, WALKWAY_ID],
      [RECEPTION_ID, WALKWAY_ID],
      [PHARMACY_ID, WALKWAY_ID],
      [CASHIER_ID, WALKWAY_ID],
      [CAFETERIA_ID, WALKWAY_ID],
    ];
    for (const wcId of RESTROOM_ZONE_IDS) {
      const host = hostBuildingForRestroom(wcId);
      if (host != null) pairs.push([host, wcId]);
      pairs.push([wcId, WALKWAY_ID]);
    }
    for (const [a, b] of pairs) {
      const diff = (this.zoneAir[a].quanta - this.zoneAir[b].quanta) * mixing;
      this.zoneAir[a].quanta -= diff;
      this.zoneAir[b].quanta += diff;
    }
  }

  /** รีเซ็ต ateLunch เมื่อพ้นช่วงเที่ยง */
  private resetLunchFlags() {
    if (this.lunchFactor() > 0.15) return;
    for (const a of this.agents) {
      if (a.ateLunch) a.ateLunch = false;
    }
  }

  step(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.5);
    this.simTime += dt;
    this.dayMinutes = (this.dayMinutes + dt * DAY_MIN_PER_SEC) % 1440;

    this.spawnVisitors(dt);
    this.spawnOpdGeneralCrowd(dt);
    this.spawnOpdArrivals(dt);
    this.updateAgents(dt);
    this.resetLunchFlags();
    this.updateZoneAir(dt);
    this.diffuseQuanta(dt);
    this.applyZoneExposure(dt);

    const cutoff =
      this.simTime - HOSPITAL_RATE_WINDOW_MIN / DAY_MIN_PER_SEC;
    while (this.infectionEvents.length && this.infectionEvents[0] < cutoff) {
      this.infectionEvents.shift();
    }
  }

  private recentInfectionCount(): number {
    const cutoff =
      this.simTime - HOSPITAL_RATE_WINDOW_MIN / DAY_MIN_PER_SEC;
    let n = 0;
    for (const t of this.infectionEvents) {
      if (t >= cutoff) n++;
    }
    return n;
  }

  private agentPosition(a: Agent): [number, number] {
    const base = zoneCenter(a.zoneId);

    if (a.path.length > 0 && a.pathIdx < a.path.length - 1) {
      const fromId = a.path[a.pathIdx];
      const toId = a.path[a.pathIdx + 1];
      const t = easeInOutCubic(Math.min(1, Math.max(0, a.moveT)));
      return pointOnSegment(fromId, toId, t);
    }

    if (a.zoneId === TB_CLINIC_ID && a.subzone && this.config.zoning === "zoned") {
      const off = TB_SUBZONES[a.subzone].offset;
      const jitter: [number, number] = [
        Math.sin(a.id * 2.17) * 2.5 + off[0],
        Math.cos(a.id * 1.83) * 2.5 + off[1],
      ];
      return [base[0] + jitter[0], base[1] + jitter[1]];
    }

    if (a.zoneId === RECEPTION_ID) {
      const slot = a.id % 42;
      const cols = 7;
      const row = Math.floor(slot / cols);
      const col = slot % cols;
      const [w, d] = ZONES[RECEPTION_ID].size;
      return [
        base[0] + (col - (cols - 1) / 2) * (w * 0.11) + Math.sin(a.id * 2.31) * 1.4,
        base[1] + (row - 2.5) * (d * 0.095) + Math.cos(a.id * 1.87) * 1.2,
      ];
    }

    const spread = ZONES[a.zoneId].size[0] * 0.25;
    const seed = a.id * 1.618;
    return [
      base[0] + Math.sin(seed) * spread,
      base[1] + Math.cos(seed * 1.3) * spread * 0.7,
    ];
  }

  getAgentSnapshots(): AgentSnapshot[] {
    return this.agents.map((a) => {
      const pos = this.agentPosition(a);
      return {
        id: a.id,
        kind: a.kind,
        status: a.status,
        zoneId: a.zoneId,
        moveT: a.moveT,
        fromZone: a.path[a.pathIdx] ?? a.zoneId,
        toZone: a.path[a.pathIdx + 1] ?? null,
        position: pos,
        exposure: a.exposure,
        identified: a.identified,
        viaOpd: a.viaOpd,
        inTransit: a.path.length > 0 && a.pathIdx < a.path.length - 1,
        activity: a.activity,
        screeningStage: this.screeningStageFor(a),
      };
    });
  }

  getZoneSnapshots(): ZoneSnapshot[] {
    return ZONES.map((z, i) => {
      let occupants = 0;
      let infectious = 0;
      for (const a of this.agents) {
        if (a.zoneId === i && a.path.length === 0) {
          occupants++;
          if (this.isInfectious(a)) infectious++;
        }
      }
      const air = this.zoneAir[i];
      const norm = air.quanta / (z.volume * z.ventilation * 0.05 + 0.01);
      const riskIndex =
        air.riskHist.length > 0
          ? air.riskHist.reduce((s, x) => s + x, 0) / air.riskHist.length
          : 0;
      return {
        id: i,
        occupants,
        infectious,
        quantaConc: norm,
        riskIndex,
        newInfections: this.zoneInfections[i],
      };
    });
  }

  getStats(): SimStats {
    let susceptible = 0;
    let exposed = 0;
    let infected = 0;
    let totalExposure = 0;
    let nSus = 0;

    for (const a of this.agents) {
      if (a.status === "susceptible") susceptible++;
      else if (a.status === "exposed") exposed++;
      else infected++;
      if (a.kind !== "active") {
        totalExposure += a.exposure;
        nSus++;
      }
    }

    const zones = this.getZoneSnapshots();
    let peakZoneId = 0;
    let peakRisk = 0;
    let secondaryInfected = 0;
    let leavingHospital = 0;
    let waitingAtOpd = 0;
    let hiddenActiveAtOpd = 0;
    let inTransit = 0;
    let atCafeteria = 0;
    let atRestroom = 0;
    let atOpd = 0;
    let opdToTbTransit = 0;
    let idenReadyAtOpd = 0;
    let visitors = 0;
    let peakRestroomZoneId = RESTROOM_ID;
    let peakRestroomRisk = 0;
    for (const z of zones) {
      if (z.riskIndex > peakRisk) {
        peakRisk = z.riskIndex;
        peakZoneId = z.id;
      }
      if (isRestroomZone(z.id) && z.riskIndex > peakRestroomRisk) {
        peakRestroomRisk = z.riskIndex;
        peakRestroomZoneId = z.id;
      }
    }
    for (const a of this.agents) {
      if (a.discharging) {
        leavingHospital++;
        continue;
      }
      if (a.status === "infected" && a.kind !== "active") secondaryInfected++;
      if (a.path.length > 0) inTransit++;
      if (a.zoneId === CAFETERIA_ID && a.path.length === 0) atCafeteria++;
      if (isRestroomZone(a.zoneId) && a.path.length === 0) atRestroom++;
      if (a.zoneId === RECEPTION_ID && a.path.length === 0) atOpd++;
      if (this.screeningStageFor(a) === "to_tb") opdToTbTransit++;
      if (this.screeningStageFor(a) === "iden_done") idenReadyAtOpd++;
      if (a.kind === "visitor") visitors++;
      if (
        a.viaOpd &&
        !a.identified &&
        a.zoneId === RECEPTION_ID &&
        a.path.length === 0
      ) {
        waitingAtOpd++;
        if (a.kind === "active") hiddenActiveAtOpd++;
      }
    }

    return {
      simTime: this.simTime,
      dayMinutes: this.dayMinutes,
      crowdFactor: this.crowdFactor,
      periodLabel: this.periodLabel,
      totalAgents: this.agents.length,
      susceptible,
      exposed,
      infected,
      newInfectionsRate: this.recentInfectionCount(),
      peakZoneId,
      peakRisk,
      infectedInClinic: this.infectedInClinic,
      infectedOutside: this.infectedOutside,
      transitInfections: this.transitInfections,
      avgExposure: nSus > 0 ? totalExposure / nSus : 0,
      activeCrossings: this.activeCrossings,
      secondaryInfected,
      leavingHospital,
      waitingAtOpd,
      hiddenActiveAtOpd,
      inTransit,
      atCafeteria,
      atRestroom,
      peakRestroomZoneId,
      peakRestroomRisk,
      atOpd,
      opdToTbTransit,
      idenReadyAtOpd,
      visitors,
    };
  }

  /** สำหรับ visualization — ค่า quanta ดิบต่อโซน */
  getZoneQuanta(): number[] {
    return this.zoneAir.map((a) => a.quanta);
  }
}
