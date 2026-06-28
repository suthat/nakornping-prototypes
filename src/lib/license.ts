export const LICENSE_ACCEPTANCE_KEY = "nkp-sim-license-accepted-v1";

export const COPYRIGHT_LINE =
  "© 2026 โรงพยาบาลนครพิงค์ จังหวัดเชียงใหม่";

export const LICENSE_INTRO =
  "NKP Mini Simulation Projects จัดทำภายใต้โครงการ Leadership Bootcamp 4 (2026) โดย DO IN THAI Company Limited — สิทธิ์การใช้งานและพัฒนาต่อเป็นของโรงพยาบาลนครพิงค์";

export const LICENSE_ATTRIBUTION_EXAMPLE =
  "อ้างอิงจาก NKP Mini Simulation Projects พัฒนาภายใต้โครงการ Leadership Bootcamp 4 (2026) — สิทธิ์การใช้งานและพัฒนาต่อเป็นของโรงพยาบาลนครพิงค์ จังหวัดเชียงใหม่ ริเริ่มโดย DO IN THAI Company Limited";

export const LICENSE_SECTIONS = [
  {
    title: "เจ้าของลิขสิทธิ์",
    body: [
      "ลิขสิทธิ์ © 2026 โรงพยาบาลนครพิงค์ จังหวัดเชียงใหม่",
      "ซอฟต์แวร์และเอกสารประกอบนี้ (NKP Mini Simulation Projects) จัดทำภายใต้โครงการ Leadership Bootcamp 4 (2026) โดย DO IN THAI Company Limited",
      "สิทธิ์ในการใช้งานและพัฒนาต่อเป็นของโรงพยาบาลนครพิงค์ จังหวัดเชียงใหม่",
    ],
  },
  {
    title: "สิ่งที่คุณได้รับอนุญาต",
    body: [
      "คุณสามารถใช้งาน คัดลอก แก้ไข รวม ตีพิมพ์ เผยแพร่ อนุญาตต่อ หรือจำหน่ายสำเนาของซอฟต์แวร์นี้ได้ โดยไม่เสียค่าใช้จ่าย",
    ],
  },
  {
    title: "เงื่อนไขที่ต้องปฏิบัติ",
    body: [
      "ต้องแสดงข้อความลิขสิทธิ์และข้อกำหนดนี้ในทุกสำเนาหรือส่วนที่สำคัญของซอฟต์แวร์",
      "ทุกครั้งที่ใช้งาน เผยแพร่ หรือพัฒนาต่อจากซอฟต์แวร์นี้ ต้องระบุที่มาให้เห็นชัดเจน โดยอ้างอิงโครงการ Leadership Bootcamp 4 (2026) โรงพยาบาลนครพิงค์ และ DO IN THAI Company Limited",
    ],
  },
  {
    title: "ข้อจำกัดความรับผิด",
    body: [
      "ซอฟต์แวร์นี้จัดให้ “ตามสภาพ” โดยไม่มีการรับประกันใดๆ ทั้งโดยชัดแจ้งหรือโดยนัย รวมถึงความเหมาะสมสำหรับวัตถุประสงค์เฉพาะ",
      "ผู้พัฒนาและเจ้าของลิขสิทธิ์ไม่รับผิดชอบต่อความเสียหาย การเรียกร้อง หรือความรับผิดใดๆ ที่เกิดจากการใช้งานหรือไม่สามารถใช้งานซอฟต์แวร์นี้ได้",
    ],
  },
] as const;

export function hasAcceptedLicense(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LICENSE_ACCEPTANCE_KEY) === "true";
}

export function acceptLicense(): void {
  window.localStorage.setItem(LICENSE_ACCEPTANCE_KEY, "true");
}
