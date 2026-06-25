import { ROUTE_LENGTH, STOPS, STOP_DISTANCES } from "./layout";
import {
  BusSnapshot,
  Passenger,
  SimConfig,
  SimStats,
  StopSnapshot,
  WEATHER,
  WeatherProfile,
} from "./types";

/** RNG แบบ seed ได้ (mulberry32) เพื่อให้ reset แล้วได้ผลซ้ำได้ */
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

interface Bus {
  id: number;
  distance: number; // ระยะสะสมบนลูป [0, L)
  nextIdx: number; // ป้ายถัดไป (index ใน STOPS)
  state: "moving" | "dwelling";
  dwellLeft: number;
  holdTime: number; // เวลาที่ค้างรอจนเต็ม (วินาที)
  onboard: Passenger[];
}

const N = STOPS.length;
const WAIT_BUFFER = 600;

/** ชั่วโมงเริ่มต้นของวันจำลอง (ก่อนพีคเช้าเล็กน้อย) */
const START_HOUR = 6.5;
/** นาทีในวันที่ผ่านไปต่อ 1 วินาที sim (1 วัน = 24 นาที sim) */
const DAY_MIN_PER_SEC = 1;
/** ครึ่งความยาวโซนรถติดหน้า รพ. (เมตร) รอบป้าย รพ. */
const TRAFFIC_ZONE_HALF = 48;

function gaussian(x: number, mu: number, sigma: number): number {
  const d = x - mu;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/** พีคเช้า ~07:45 และพีคเย็น ~17:00 (หน่วย: นาทีในวัน) */
function morningBump(min: number) {
  return gaussian(min, 7.75 * 60, 48);
}
function eveningBump(min: number) {
  return gaussian(min, 17 * 60, 55);
}

/** ตัวคูณดีมานด์ตามช่วงเวลาในวัน */
function demandProfile(min: number): number {
  return 0.35 + 1.95 * morningBump(min) + 1.2 * eveningBump(min);
}

/** สัดส่วนการเดินทาง "เข้า รพ." (เช้า≈1, เย็น≈0, กลางวัน≈สมดุล) */
function inboundShare(min: number): number {
  const m = morningBump(min);
  const e = eveningBump(min);
  if (m + e < 0.05) return 0.5;
  return m / (m + e);
}

export class Simulation {
  config: SimConfig;
  rand: () => number;

  simTime = 0;
  dayMinutes = START_HOUR * 60;
  buses: Bus[] = [];
  queues: Passenger[][] = [];
  servedPerStop: number[] = [];
  leftBehindPerStop: number[] = [];

  private nextPassengerId = 1;
  private waitBuffer: number[] = []; // วินาทีที่รอ (rolling)
  private waitCursor = 0;
  private waitCount = 0;
  private boardEvents: number[] = []; // boardTime ล่าสุด สำหรับ throughput
  private totalServed = 0;
  private totalLeftBehind = 0;

  constructor(config: SimConfig, seed = 12345) {
    this.config = { ...config };
    this.rand = mulberry32(seed);
    this.reset(config, seed);
  }

  reset(config: SimConfig, seed = 12345) {
    this.config = { ...config };
    this.rand = mulberry32(seed);
    this.simTime = 0;
    this.dayMinutes = START_HOUR * 60;
    this.queues = STOPS.map(() => []);
    this.servedPerStop = STOPS.map(() => 0);
    this.leftBehindPerStop = STOPS.map(() => 0);
    this.waitBuffer = [];
    this.waitCursor = 0;
    this.waitCount = 0;
    this.boardEvents = [];
    this.totalServed = 0;
    this.totalLeftBehind = 0;
    this.nextPassengerId = 1;
    this.initBuses(config.numBuses);
  }

  private initBuses(num: number) {
    this.buses = [];
    for (let i = 0; i < num; i++) {
      const distance = (i * ROUTE_LENGTH) / num;
      this.buses.push({
        id: i,
        distance,
        nextIdx: this.firstStopAfter(distance),
        state: "moving",
        dwellLeft: 0,
        holdTime: 0,
        onboard: [],
      });
    }
  }

  private firstStopAfter(distance: number): number {
    for (let i = 0; i < N; i++) {
      if (STOP_DISTANCES[i] > distance + 0.001) return i;
    }
    return 0; // วนกลับป้ายแรก
  }

  /** อัปเดต config ระหว่างรัน */
  applyConfig(config: SimConfig) {
    const busesChanged = config.numBuses !== this.config.numBuses;
    this.config = { ...config };
    if (busesChanged) this.initBuses(config.numBuses);
  }

  get capacity(): number {
    return this.config.seatsPerBus + this.config.standingPerBus;
  }

  get weather(): WeatherProfile {
    return WEATHER[this.config.weather] ?? WEATHER.clear;
  }

  /** ความเร็วรถจริง (เมตร/วินาที) — แปลงจาก กม./ชม. และคูณผลสภาพอากาศ */
  get effectiveSpeed(): number {
    return (this.config.busSpeed / 3.6) * this.weather.speedMult;
  }

  /** ตัวคูณดีมานด์ตามช่วงเวลา (1 = ปกติ) */
  get demandFactorNow(): number {
    return this.config.rushHour ? demandProfile(this.dayMinutes) : 1;
  }

  /** สัดส่วนการเดินทางมุ่งเข้า รพ. ณ เวลานี้ */
  get inboundNow(): number {
    return this.config.rushHour ? inboundShare(this.dayMinutes) : 0.5;
  }

  /** ระดับรถติดหน้า รพ. (0 โล่ง .. ~0.92 ติดหนัก) ขึ้นกับความหนาแน่น + ฝน */
  get trafficLevelNow(): number {
    if (!this.config.traffic) return 0;
    const rush = this.demandFactorNow;
    const rainExtra = (this.weather.demandMult - 1) * 0.5;
    const lvl = 0.18 + 0.5 * (rush - 1) + rainExtra;
    return Math.max(0, Math.min(0.92, lvl));
  }

  /** ตัวคูณความเร็วเมื่อผ่านโซนหน้า รพ. (1 = ไม่ติด) */
  private congestionFactor(distance: number, level: number): number {
    if (level <= 0) return 1;
    const d0 = STOP_DISTANCES[0];
    let diff = Math.abs(distance - d0);
    diff = Math.min(diff, ROUTE_LENGTH - diff);
    const half = TRAFFIC_ZONE_HALF;
    if (diff >= half) return 1;
    const x = 1 - diff / half;
    const intensity = x * x * (3 - 2 * x); // smoothstep
    return 1 - level * intensity * 0.92;
  }

  /** อัตราผู้โดยสารจริง (คน/นาที) หลังผลของสภาพอากาศ + ช่วงเวลา */
  get effectiveArrivalRate(): number {
    return (
      this.config.arrivalRate * this.weather.demandMult * this.demandFactorNow
    );
  }

  private samplePoisson(lambda: number): number {
    if (lambda <= 0) return 0;
    if (lambda > 30) {
      // ประมาณด้วย normal เมื่อ lambda สูง
      const g =
        Math.sqrt(-2 * Math.log(this.rand() + 1e-9)) *
        Math.cos(2 * Math.PI * this.rand());
      return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * g));
    }
    const Lp = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.rand();
    } while (p > Lp);
    return k - 1;
  }

  private pickWeighted(weights: number[], exclude = -1): number {
    let total = 0;
    for (let i = 0; i < N; i++) {
      if (i === exclude) continue;
      total += weights[i];
    }
    let r = this.rand() * total;
    for (let i = 0; i < N; i++) {
      if (i === exclude) continue;
      r -= weights[i];
      if (r <= 0) return i;
    }
    return exclude === 0 ? 1 : 0;
  }

  /**
   * น้ำหนักต้นทาง/ปลายทางตามทิศการเดินทาง
   * inbound→1: คนเริ่มจากลานจอด มุ่งเข้า รพ. (เช้า)
   * inbound→0: คนเริ่มจาก รพ. ออกไปลานจอด (เย็น)
   */
  private flowWeights(asDestination: boolean): number[] {
    const inbound = this.inboundNow;
    return STOPS.map((s) => {
      const base = s.demandWeight;
      const isHosp = s.kind === "hospital";
      // โอกาสที่ "รพ." เป็นปลายทาง = inbound, เป็นต้นทาง = 1-inbound
      const hospShare = asDestination ? inbound : 1 - inbound;
      const otherShare = asDestination ? 1 - inbound : inbound;
      const dir = isHosp ? hospShare : otherShare;
      // ผสมแบบ: ปกติ (0.5) ใช้ base ล้วน, ยิ่งเร่งด่วนยิ่งเอียงตามทิศ
      const mult = 0.25 + 1.9 * dir;
      return base * mult;
    });
  }

  private generateArrivals(dt: number) {
    const lambdaPerSec = this.effectiveArrivalRate / 60;
    const count = this.samplePoisson(lambdaPerSec * dt);
    if (count <= 0) return;
    const originW = this.flowWeights(false);
    const destW = this.flowWeights(true);
    for (let i = 0; i < count; i++) {
      const origin = this.pickWeighted(originW);
      const destination = this.pickWeighted(destW, origin);
      this.queues[origin].push({
        id: this.nextPassengerId++,
        origin,
        destination,
        arrivalTime: this.simTime,
      });
    }
  }

  private recordWait(wait: number) {
    if (this.waitBuffer.length < WAIT_BUFFER) {
      this.waitBuffer.push(wait);
    } else {
      this.waitBuffer[this.waitCursor] = wait;
      this.waitCursor = (this.waitCursor + 1) % WAIT_BUFFER;
    }
    this.waitCount++;
  }

  /** ขึ้นรถจากคิวที่ป้าย คืนจำนวนที่ขึ้นได้ */
  private boardPassengers(bus: Bus, stopIdx: number): number {
    const cap = this.capacity;
    const queue = this.queues[stopIdx];
    let boarded = 0;
    while (queue.length > 0 && bus.onboard.length < cap) {
      const p = queue.shift()!;
      p.boardTime = this.simTime;
      this.recordWait(this.simTime - p.arrivalTime);
      bus.onboard.push(p);
      boarded++;
      this.boardEvents.push(this.simTime);
    }
    this.servedPerStop[stopIdx] += boarded;
    this.totalServed += boarded;
    return boarded;
  }

  private handleArrivalAtStop(bus: Bus, stopIdx: number) {
    const cfg = this.config;
    const cap = this.capacity;

    // ลงรถ
    let alighted = 0;
    if (bus.onboard.length) {
      bus.onboard = bus.onboard.filter((p) => {
        if (p.destination === stopIdx) {
          alighted++;
          return false;
        }
        return true;
      });
    }

    // ขึ้นรถ
    const boarded = this.boardPassengers(bus, stopIdx);
    const queue = this.queues[stopIdx];

    // ตกรถ: เต็มแต่ยังมีคนรอ → นับเป็นเหตุการณ์รอรอบถัดไป
    if (bus.onboard.length >= cap && queue.length > 0) {
      this.leftBehindPerStop[stopIdx] += queue.length;
      this.totalLeftBehind += queue.length;
    }

    const boardMult = this.weather.boardMult;
    bus.dwellLeft =
      cfg.minDwell +
      boarded * cfg.boardTimePerPax * boardMult +
      alighted * cfg.alightTimePerPax * boardMult;
    bus.holdTime = 0;
    bus.state = "dwelling";
  }

  step(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.5); // กัน dt กระโดด
    this.simTime += dt;
    this.dayMinutes = (this.dayMinutes + dt * DAY_MIN_PER_SEC) % 1440;

    this.generateArrivals(dt);

    const v = this.effectiveSpeed;
    const traffic = this.trafficLevelNow;
    for (const bus of this.buses) {
      if (bus.state === "dwelling") {
        bus.dwellLeft -= dt;

        // โหมดรอจนเต็ม: จอดรับคนที่เพิ่งมาต่อไปจนกว่าจะเต็มหรือครบเวลารอสูงสุด
        if (this.config.holdUntilFull && bus.onboard.length < this.capacity) {
          this.boardPassengers(bus, bus.nextIdx);
          bus.holdTime += dt;
          if (
            bus.onboard.length < this.capacity &&
            bus.holdTime < this.config.maxHold
          ) {
            if (bus.dwellLeft < 0) bus.dwellLeft = 0;
            continue; // ยังไม่ออก
          }
        }

        if (bus.dwellLeft <= 0) {
          bus.state = "moving";
          bus.nextIdx = (bus.nextIdx + 1) % N;
          bus.holdTime = 0;
        }
        continue;
      }
      // moving — ชะลอตามรถติดหน้า รพ.
      let advance = v * this.congestionFactor(bus.distance, traffic) * dt;
      // ตรวจว่าถึงป้ายถัดไปหรือยัง (จัดการ wrap)
      let remaining = STOP_DISTANCES[bus.nextIdx] - bus.distance;
      if (remaining < 0) remaining += ROUTE_LENGTH;
      if (advance >= remaining) {
        bus.distance = STOP_DISTANCES[bus.nextIdx];
        this.handleArrivalAtStop(bus, bus.nextIdx);
      } else {
        bus.distance = (bus.distance + advance) % ROUTE_LENGTH;
      }
    }

    // ตัด throughput window 60 วินาที
    const cutoff = this.simTime - 60;
    if (this.boardEvents.length && this.boardEvents[0] < cutoff) {
      let i = 0;
      while (i < this.boardEvents.length && this.boardEvents[i] < cutoff) i++;
      if (i > 0) this.boardEvents.splice(0, i);
    }
  }

  // ---------- snapshots สำหรับ render / HUD ----------

  getBusSnapshots(): BusSnapshot[] {
    const cap = this.capacity;
    const seats = this.config.seatsPerBus;
    return this.buses.map((b) => ({
      id: b.id,
      distance: b.distance,
      state: b.state,
      onboard: b.onboard.length,
      capacity: cap,
      occupancyRatio: cap > 0 ? b.onboard.length / cap : 0,
      load: seats > 0 ? b.onboard.length / seats : 0,
    }));
  }

  getStopSnapshots(): StopSnapshot[] {
    return this.queues.map((q, i) => {
      let sumWait = 0;
      let oldest = 0;
      for (const p of q) {
        const w = this.simTime - p.arrivalTime;
        sumWait += w;
        if (w > oldest) oldest = w;
      }
      return {
        id: i,
        queue: q.length,
        avgWaitNow: q.length ? sumWait / q.length : 0,
        oldestWait: oldest,
        served: this.servedPerStop[i],
        leftBehind: this.leftBehindPerStop[i],
      };
    });
  }

  private waitPercentiles(): { avg: number; p90: number; max: number } {
    const buf = this.waitBuffer;
    if (!buf.length) return { avg: 0, p90: 0, max: 0 };
    const sorted = [...buf].sort((a, b) => a - b);
    const avg = sorted.reduce((s, x) => s + x, 0) / sorted.length;
    const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
    const max = sorted[sorted.length - 1];
    return { avg, p90, max };
  }

  /**
   * อัลกอริทึมเวลารอตามทฤษฎีขนส่งมวลชน
   * - เวลารอบ (cycle) = ระยะลูป/ความเร็ว + เวลาจอดทุกป้าย
   * - headway H = cycle / จำนวนรถ
   * - ผู้โดยสารมาแบบสุ่ม (Poisson) → เวลารอเฉลี่ย ≈ H/2
   * - ถ้า demand > capacity → ระบบ overload เวลารอพุ่งขึ้นตาม load factor
   */
  getStats(): SimStats {
    const cfg = this.config;
    const cap = this.capacity;
    const { avg, p90, max } = this.waitPercentiles();

    let totalWaiting = 0;
    for (const q of this.queues) totalWaiting += q.length;
    let onboard = 0;
    for (const b of this.buses) onboard += b.onboard.length;

    const seatCapTotal = cfg.numBuses * cfg.seatsPerBus;
    const seatUtil = seatCapTotal > 0 ? Math.min(1, onboard / seatCapTotal) : 0;

    // ใช้ค่าหลังผลของสภาพอากาศ
    const vEff = Math.max(0.1, this.effectiveSpeed);
    const rateEff = this.effectiveArrivalRate;
    const boardMult = this.weather.boardMult;

    // เวลาเฉลี่ยที่ใช้จอดต่อป้าย (ประมาณการ)
    const expectBoardPerStop = Math.max(
      1,
      (rateEff / 60) * (ROUTE_LENGTH / vEff) / Math.max(1, N)
    );
    const avgDwell =
      cfg.minDwell + expectBoardPerStop * cfg.boardTimePerPax * boardMult;
    // หน่วงเวลาจากรถติดหน้า รพ. (เพิ่มเข้า cycle)
    const tl = this.trafficLevelNow;
    const avgFactor = Math.max(0.1, 1 - tl * 0.46);
    const trafficDelay = ((2 * TRAFFIC_ZONE_HALF) / vEff) * (1 / avgFactor - 1);

    const cycle = ROUTE_LENGTH / vEff + N * avgDwell + trafficDelay;
    const headway = cycle / Math.max(1, cfg.numBuses);

    // ความจุระบบ (boardings/นาที): ที่นั่ง+ยืน หมุนเวียนทุกครึ่งลูปโดยเฉลี่ย
    const avgRideTime = cycle / 2;
    const capacityPerMin =
      avgRideTime > 0 ? (cfg.numBuses * cap * 60) / avgRideTime : 0;
    const demandPerMin = rateEff;
    const loadFactor = capacityPerMin > 0 ? demandPerMin / capacityPerMin : 99;

    // เวลารอตามทฤษฎี: H/2 ปรับด้วย overload (queueing แบบ saturate)
    let theoreticalWait = headway / 2;
    if (loadFactor > 0.85) {
      const rho = Math.min(loadFactor, 2.5);
      theoreticalWait = (headway / 2) * (1 + Math.max(0, rho - 0.85) * 4);
    }

    const throughput = this.boardEvents.length; // คน/นาที (window 60s)

    return {
      simTime: this.simTime,
      totalWaiting,
      avgWait: avg,
      p90Wait: p90,
      maxWait: max,
      onboard,
      seatUtil,
      leftBehind: this.totalLeftBehind,
      served: this.totalServed,
      headway,
      theoreticalWait,
      throughput,
      demandPerMin,
      capacityPerMin,
      loadFactor,
      dayMinutes: this.dayMinutes,
      demandFactor: this.demandFactorNow,
      inbound: this.inboundNow,
      trafficLevel: tl,
    };
  }
}
