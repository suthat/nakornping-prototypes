# NKP Shuttle Simulation — รพ.นครพิงค์

การจำลอง 3 มิติ มุมมอง **bird's eye view** โทนขาวสไตล์สถาปนิก สำหรับเส้นทางรถ **shuttle bus**
รับส่งผู้โดยสารระหว่างโรงพยาบาลนครพิงค์กับลานจอดรถรอบนอก พร้อมอัลกอริทึมคำนวณ
**เวลารอ (waiting time)** ตามหลักการขนส่งมวลชนจริง

## ฟีเจอร์

- **ฉาก 3 มิติ** โทนขาวมินิมอล — ตึก รพ., ลานจอด P1–P3, ถนนวนลูป, ป้ายจอดมีจุดกระพริบ
- **รถ shuttle** เคลื่อนที่ลื่นไหลตามเส้นโค้ง Catmull-Rom พร้อมแถบแสดงจำนวนผู้โดยสาร
- **คนรอ** แสดงเป็นกลุ่ม ระบายสีตามเวลารอ (ฟ้า → ส้ม → แดง)
- **สภาพอากาศ** แจ่มใส / ฝนปรอย / ฝนตกหนัก — ฝนตกทำให้ผู้โดยสารเพิ่ม รถวิ่งช้าลง เวลาขึ้นรถนานขึ้น และ **คนแออัดหลบเข้าตึก/ใต้หลังคา** พร้อมเอฟเฟกต์สายฝนและแสงครึ้ม
- **Config panel** ปรับได้แบบสด: จำนวนรถ, ที่นั่ง/ที่ยืน, ความเร็ว, เวลาจอดป้าย, อัตราผู้โดยสาร, ความเร็วการจำลอง
- **Stats panel เรียลไทม์**: เวลารอเฉลี่ย/P90/สูงสุด, headway, ภาระระบบ (load factor), คนตกรถ, throughput

## อัลกอริทึมเวลารอ

อ้างอิงหลักการขนส่งมวลชน (`src/lib/simulation.ts`):

- **Passenger arrival** — กระบวนการ Poisson กระจายตามน้ำหนักความต้องการของแต่ละจุด
- **Cycle time** = ระยะลูป / ความเร็ว + เวลาจอดทุกป้าย
- **Headway** `H` = cycle / จำนวนรถ → เวลารอเฉลี่ยเชิงทฤษฎี ≈ `H/2`
- **Capacity & overload** — เมื่อ demand > capacity ระบบ saturate คิวและเวลารอพุ่งขึ้น (มีการนับ "คนตกรถ")
- เปรียบเทียบค่า **ทฤษฎี** กับค่า **empirical** ที่วัดจากการจำลองจริงทุกเฟรม

## เทคโนโลยี

Next.js 16 · React 19 · TypeScript · Tailwind v4 · three.js · @react-three/fiber · drei · zustand

## เริ่มใช้งาน

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## โครงสร้างหลัก

```
src/
  lib/
    layout.ts        # ผังพื้นที่ รพ. / ป้าย / เส้นทาง
    simulation.ts    # เครื่องจำลอง + อัลกอริทึมเวลารอ
    store.ts         # zustand (config / stats)
    SimProvider.tsx  # แชร์ instance ของ simulation
  components/
    Scene.tsx        # Canvas, แสง, กล้อง, controls
    world/           # Ground, Buildings, Roads, Parking, Stops, People, Buses
    ui/              # Header, ConfigPanel, StatsPanel, Legend
```
