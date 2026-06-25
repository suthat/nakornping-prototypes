export type WeatherKind = "clear" | "rain" | "storm";

export interface WeatherProfile {
  /** ระดับความแรงฝน 0..1 (ใช้กับเอฟเฟกต์/พฤติกรรม) */
  rainLevel: number;
  /** ตัวคูณความต้องการเดินทาง (ฝนตก คนอยากนั่งรถมากขึ้น) */
  demandMult: number;
  /** ตัวคูณความเร็วรถ (ฝนตก ถนนลื่น วิ่งช้าลง) */
  speedMult: number;
  /** ตัวคูณเวลาขึ้น/ลงรถ (กางร่ม เดินช้า) */
  boardMult: number;
  /** สัดส่วนคนที่หลบเข้าตึก/ใต้หลังคาขณะรอ */
  shelterRatio: number;
  label: string;
}

export const WEATHER: Record<WeatherKind, WeatherProfile> = {
  clear: {
    rainLevel: 0,
    demandMult: 1,
    speedMult: 1,
    boardMult: 1,
    shelterRatio: 0,
    label: "แจ่มใส",
  },
  rain: {
    rainLevel: 0.55,
    demandMult: 1.3,
    speedMult: 0.82,
    boardMult: 1.3,
    shelterRatio: 0.8,
    label: "ฝนปรอย",
  },
  storm: {
    rainLevel: 1,
    demandMult: 1.6,
    speedMult: 0.65,
    boardMult: 1.6,
    shelterRatio: 1,
    label: "ฝนตกหนัก",
  },
};

export interface SimConfig {
  /** สภาพอากาศ */
  weather: WeatherKind;
  /** จำนวนรถ shuttle */
  numBuses: number;
  /** จำนวนที่นั่งต่อคัน */
  seatsPerBus: number;
  /** จำนวนที่ยืนได้ต่อคัน */
  standingPerBus: number;
  /** ความเร็วรถ (กม./ชม.) */
  busSpeed: number;
  /** เวลาจอดป้ายขั้นต่ำ (วินาที) */
  minDwell: number;
  /** เวลาขึ้นรถต่อคน (วินาที) */
  boardTimePerPax: number;
  /** เวลาลงรถต่อคน (วินาที) */
  alightTimePerPax: number;
  /** อัตราผู้โดยสารมาถึงรวมทุกป้าย (คน/นาที) */
  arrivalRate: number;
  /** ตัวคูณความเร็วการจำลอง */
  simSpeed: number;
  /** รอผู้โดยสารเต็มคันก่อนออก (จอดรับจนเต็ม หรือครบเวลารอสูงสุด) */
  holdUntilFull: boolean;
  /** เวลารอสูงสุดขณะ hold-until-full (วินาที) กันค้างตอนคนน้อย */
  maxHold: number;
  /** จำลองชั่วโมงเร่งด่วนตามเวลาในวัน (เช้าคนเข้า รพ. เยอะ) */
  rushHour: boolean;
  /** จำลองรถติดในพื้นที่ รพ. (รถ shuttle ช้าลงในโซนหน้าอาคาร) */
  traffic: boolean;
}

export const DEFAULT_CONFIG: SimConfig = {
  weather: "clear",
  numBuses: 3,
  seatsPerBus: 12,
  standingPerBus: 8,
  busSpeed: 32,
  minDwell: 6,
  boardTimePerPax: 1.4,
  alightTimePerPax: 0.9,
  arrivalRate: 26,
  simSpeed: 6,
  holdUntilFull: false,
  maxHold: 90,
  rushHour: true,
  traffic: true,
};

export interface Passenger {
  id: number;
  origin: number;
  destination: number;
  arrivalTime: number; // วินาที sim ที่มาถึงป้าย
  boardTime?: number;
}

export type BusState = "moving" | "dwelling";

export interface BusSnapshot {
  id: number;
  distance: number; // ระยะสะสมบนลูป (เมตร)
  state: BusState;
  onboard: number;
  capacity: number;
  occupancyRatio: number;
  load: number; // 0..1 เทียบกับ "เต็มสบาย" (ที่นั่ง)
}

export interface StopSnapshot {
  id: number;
  queue: number;
  avgWaitNow: number; // เวลารอเฉลี่ยของคนที่กำลังรออยู่ (วินาที)
  oldestWait: number;
  served: number;
  leftBehind: number;
}

export interface SimStats {
  simTime: number;
  totalWaiting: number;
  avgWait: number; // เวลารอเฉลี่ยของผู้โดยสารที่ขึ้นรถแล้ว (วินาที)
  p90Wait: number;
  maxWait: number;
  onboard: number;
  seatUtil: number; // % การใช้งานที่นั่ง
  leftBehind: number;
  served: number;
  headway: number; // ระยะห่างรถตามทฤษฎี (วินาที)
  theoreticalWait: number; // เวลารอตามทฤษฎีขนส่งมวลชน (วินาที)
  throughput: number; // คน/นาที ที่ขึ้นรถได้
  demandPerMin: number;
  capacityPerMin: number; // ความจุระบบ (คน/นาที)
  loadFactor: number; // demand / capacity
  dayMinutes: number; // เวลาในวัน (นาทีนับจากเที่ยงคืน)
  demandFactor: number; // ตัวคูณดีมานด์ตามช่วงเวลา (1 = ปกติ)
  inbound: number; // สัดส่วนการเดินทางมุ่งเข้า รพ. (0..1)
  trafficLevel: number; // ระดับรถติดหน้า รพ. (0 = โล่ง, 1 = ติดหนัก)
}
