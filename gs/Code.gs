/**
 * LUKPAD HAND MADE — Google Apps Script (Web App) สำหรับซิงก์ข้อมูลกับสเปรดชีต
 *
 * ★ วิธีติดตั้งบนสเปรดชีตใหม่ (ครั้งเดียว ~2 นาที)
 * 1. สร้างสเปรดชีตใหม่ (sheets.new) → ตั้งชื่อ เช่น "LUKPAD DATA"
 * 2. เมนู "ส่วนขยาย (Extensions)" → "Apps Script"
 * 3. ลบทุกโค้ดที่มีอยู่ แล้ววางไฟล์นี้ทั้งหมด → กด Save (💾)
 * 4. ที่ dropdown ของฟังก์ชัน เลือก "setup" แล้วกด Run (▶)
 *    · ครั้งแรกจะถามสิทธิ์ → ให้กด Allow access
 *    · เสร็จแล้วจะมีแท็บ PRODUCTS / ORDERS / ORDER_DETAILS / PAYMENTS / SHIPMENTS / คู่มือ พร้อมหัวคอลัมน์เองทั้งหมด
 * 5. Deploy → New deployment → ชนิด: Web app
 *    - Execute as: Me (บัญชี Google ของคุณ)
 *    - Who has access: Anyone → Deploy → Allow access
 * 6. คัดลอก URL ที่ขึ้นต้นด้วย https://script.google.com/macros/s/.../exec
 *    ไปวางในหน้า "ซิงก์ชีต" ของแอป (เมนูแอดมิน)
 * 7. (แนะนำ) เลือกฟังก์ชัน refreshPreviews แล้วกด Run (▶) — เขียนสูตร =IMAGE ให้ทุกแถวที่มีอยู่แล้ว
 *    จะเห็นรูปสลิป/รูปสินค้าในเซลล์ทันที แม้แถวนั้นถูกสร้างไว้ก่อนอัปเดตสคริปต์
 *
 * ★ สำคัญมาก: ถ้าเคย deploy สคริปต์เวอร์ชันเก่าไว้ ต้องวางโค้ดนี้ทับ + Deploy เวอร์ชันใหม่เสมอ
 *   ไม่งั้นปุ่ม/การแนบสลิปจะไม่ทำงาน (ฝั่งแอปจะขึ้นว่า "สคริปต์ในชีตเป็นเวอร์ชันเก่า")
 *
 * ★ ถ้าแก้สคริปต์ครั้งหลัง: Deploy → Manage deployments → ✎ Edit → Version: New version (ใช้ URL เดิมได้เลย)
 *
 * ★ หมายเหตุ
 * - แท็บ USERS อ่านได้แต่แอปจะไม่เขียนทับ (ยังเก็บสมาชิกในเครื่อง)
 * - ข้อมูลที่จะถูกเขียนทับเมื่อกด "อัปโหลดขึ้นชีต": USERS, PRODUCTS, ORDERS, ORDER_DETAILS, PAYMENTS, SHIPMENTS
 * - รูปสินค้าเข้า Google Drive โฟลเดอร์ "lukpad-images" และสลิปโอนเงินเข้าโฟลเดอร์ "lukpad-slips"
 *   แล้วนำลิงก์ไปใส่คอลัมน์ product_image / slip_image (คลิกเปิดดูรูปได้จากชีตเลย)
 * - ถ้าต้องการชี้โฟลเดอร์เอง (เช่น สร้างโฟลเดอร์ไว้ก่อนแล้ว) ให้ใส่ Folder ID ในตัวแปร FOLDERS ด้านล่าง
 *   คัด ID จากลิงก์: drive.google.com/drive/folders/<FOLDER_ID> — ตัวเลือกนี้ชนะการค้นตามชื่อเสมอ
 * - ช่องทางดูสลิปในชีต: แท็บ ORDERS (คอลัมน์ slip_image) และแท็บ PAYMENTS (คอลัมน์ slip_image)
 */

const TAB = { users: "USERS", products: "PRODUCTS", orders: "ORDERS", details: "ORDER_DETAILS", payments: "PAYMENTS", shipments: "SHIPMENTS" };

/* หัวคอลัมน์ที่ต้องมีของแต่ละแท็บ (ขาดอันไหน setup จะเพิ่มให้เอง) */
const NEED = {
  users: ["user_id", "user_name", "email", "password", "phone", "address", "user_role"],
  products: ["product_id", "product_name", "category", "product_image", "product_image_preview", "price", "shipping_fee", "size", "description", "is_customizable", "updated_at"],
  orders: ["order_id", "user_id", "order_date", "total_amount", "order_status", "ship_address", "slip_image", "slip_preview", "slip_name", "carrier", "tracking_number", "updated_at"],
  details: ["order_detail_id", "order_id", "product_id", "product_name", "quantity", "unit_price", "custom_note"],
  payments: ["payment_id", "order_id", "receipt_no", "payment_date", "payment_amount", "payment_status", "slip_image", "slip_preview", "slip_name"],
  shipments: ["shipment_id", "order_id", "shipping_company", "tracking_number", "shipping_status", "shipping_fee"]
};

/* แท็บ "คู่มือ" — อธิบายแต่ละแท็บ/คอลัมน์เป็นภาษาไทย */
const GUIDE = [
  ["คู่มือใช้งานสเปรดชีต LUKPAD HAND MADE (เชื่อมกับแอปร้านลูกปัดแฮนด์เมด)"],
  [""],
  ["■ ติดตั้งครั้งเดียว"],
  ["1. เปิดสเปรดชีต → ส่วนขยาย (Extensions) → Apps Script → วางไฟล์ Code.gs → Save"],
  ["2. เลือกฟังก์ชัน setup แล้วกด Run (▶) — ครั้งแรกให้กด Allow access แท็บทั้งหมดจะถูกสร้างให้เอง"],
  ["3. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → Deploy"],
  ["4. คัดลอก URL (https://script.google.com/macros/s/…/exec) ไปวางที่เมนู “ซิงก์ชีต” ในแอป (แอดมิน)"],
  [""],
  ["■ ปุ่มซิงก์ในแอป"],
  ["⬆ อัปโหลดขึ้นชีต = เขียนข้อมูลจากแอปทับแท็บ USERS / PRODUCTS / ORDERS / ORDER_DETAILS / PAYMENTS / SHIPMENTS"],
  ["⬇ ดึงข้อมูลจากชีต = อ่านข้อมูลจากแท็บเหล่านี้มาทับข้อมูลในแอป"],
  ["เคล็ดลับ: แก้ข้อมูลในแอปแล้วกดซิงก์เสมอ ไม่ต้องพิมพ์ลงชีตด้วยมือ (ถ้าพิมพ์ในชีต ให้กด ⬇ เพื่อนำกลับเข้าแอป)"],
  ["การสมัครสมาชิกใหม่จะถูกส่งขึ้นแท็บ USERS ให้อัตโนมัติ (ถ้าตั้งค่า Web App URL แล้ว)"],
  [""],
  ["■ โฟลเดอร์รูปใน Google Drive"],
  ["รูปสินค้า → โฟลเดอร์ lukpad-images · สลิปโอนเงิน → โฟลเดอร์ lukpad-slips"],
  ["ถ้าสร้างโฟลเดอร์เองไว้แล้ว ให้ใส่ Folder ID ในตัวแปร FOLDERS (บนสุดของไฟล์ Code.gs) — คัดจากลิงก์ drive.google.com/drive/folders/…"],
  ["ระบบตั้งสิทธิ์ไฟล์เป็น “ใครมีลิงก์ดูได้” แล้วเขียนลิงก์ลงคอลัมน์ product_image / slip_image (คลิกเปิดรูปจากชีตได้)"],
  ["ตรวจสิทธิ์/ทดสอบอัปโหลด: เลือกฟังก์ชัน checkDrive แล้วกด Run → ดูผลที่ View → Logs (ลบไฟล์ test-*.png ทิ้งได้)"],
  [""],
  ["■ เห็นรูปสลิป/รูปสินค้าในชีตเลย (ไม่ต้องคลิก ไม่ต้องเข้าแอป)"],
  ["ORDERS คอลัมน์ slip_preview = รูปสลิปแสดงในเซลล์ · PAYMENTS คอลัมน์ slip_preview = รูปสลิป · PRODUCTS คอลัมน์ product_image_preview = รูปสินค้า"],
  ["คอลัมน์เหล่านี้เป็นสูตร =IMAGE(...) ที่สคริปต์สร้างให้เองทุกครั้งที่ซิงก์ — จึงเห็นรูปทันทีที่เปิดชีต (อยากดูรูปใหญ่ = คลิกที่เซลล์ แล้วดูตัวอย่าง หรือคลิกลิงก์ในคอลัมน์ slip_image)"],
  ["แถวจะถูกปรับความสูงให้พอดีรูปอัตโนมัติ · อยากปิด/ปรับขนาด แก้ที่ตัวแปร PREVIEW บนสุดของไฟล์ Code.gs"],
  ["ห้ามพิมพ์ทับคอลัมน์ *_preview เอง (สคริปต์จะเขียนสูตรใหม่ทับทุกครั้งที่ซิงก์)"],
  ["★ เปิดชีตแล้วช่องรูปว่าง (แถวเก่าที่มีมาก่อนอัปเดตสคริปต์): เลือกฟังก์ชัน refreshPreviews แล้วกด Run หนึ่งครั้ง"],
  ["★ สลิปของออเดอร์เก่าที่ขึ้นเป็น “ชื่อไฟล์ .jpg/.png” เฉย ๆ = สลิปที่แนบตอนสคริปต์เวอร์ชันเก่า (รูปไม่เคยขึ้น Drive) — ต้องแนบใหม่จากหน้าแอดมิน หรือให้ลูกค้าเปิดแอปจากเครื่องเดิมแล้วแนบใหม่"],
  [""],
  ["■ แท็บต่าง ๆ และคอลัมน์"],
  ["PRODUCTS = ข้อมูลสินค้า"],
  ["   product_id = รหัสสินค้า · product_name = ชื่อสินค้า · category = ประเภท"],
  ["   product_image = ลิงก์รูป (แอปอัปโหลดเข้า Google Drive ให้เอง) · product_image_preview = ช่องแสดงรูปในชีต (สูตรอัตโนมัติ) · price = ราคา · shipping_fee = ค่าจัดส่ง"],
  ["   size = ขนาด · description = รายละเอียด · is_customizable = เปิดให้ปรับแต่ง (1=ได้, 0=ไม่) · updated_at = วันเวลาที่อัปเดตล่าสุด"],
  ["ORDERS = คำสั่งซื้อ (1 แถว = 1 ใบสั่งซื้อ)"],
  ["   order_id = เลขคำสั่งซื้อ · user_id = รหัสสมาชิก · order_date = วันที่สั่ง · total_amount = ยอดรวม"],
  ["   order_status = สถานะ (รอชำระเงิน / ตรวจสอบชำระเงินแล้ว / กำลังจัดทำ / จัดส่งแล้ว / สำเร็จ / ยกเลิก)"],
  ["   ship_address = ที่อยู่จัดส่ง · carrier = บริษัทขนส่ง · tracking_number = เลขพัสดุ · updated_at = วันเวลาที่อัปเดต"],
  ["   slip_image = ลิงก์รูปสลิปโอนเงินใน Google Drive (คลิกที่เซลล์เพื่อเปิดดูรูปได้เลย) · slip_preview = รูปสลิปที่แสดงในเซลล์ทันที · slip_name = ชื่อไฟล์สลิปเดิม"],
  ["ORDER_DETAILS = รายการสินค้าในแต่ละคำสั่งซื้อ (1 แถว = 1 รายการ)"],
  ["   order_detail_id = รหัสแถว · order_id = เลขคำสั่งซื้อ · product_id = รหัสสินค้า · product_name = ชื่อสินค้า ณ วันสั่งซื้อ"],
  ["   quantity = จำนวน · unit_price = ราคาต่อหน่วย · custom_note = ตัวเลือกปรับแต่ง (เช่น “สี: ชมพู, ขนาด: M”)"],
  ["PAYMENTS = การชำระเงิน (แถวจะเกิดขึ้นเมื่อลูกค้าแนบสลิป)"],
  ["   payment_id = รหัส · order_id = เลขคำสั่งซื้อ · receipt_no = ชื่อไฟล์สลิป · payment_date = วันที่โอน · payment_amount = จำนวนเงิน · payment_status = สถานะ"],
  ["   slip_image = ลิงก์รูปสลิป (เปิดดูได้จากชีต) · slip_preview = รูปสลิปที่แสดงในเซลล์ · slip_name = ชื่อไฟล์สลิป"],
  ["SHIPMENTS = การจัดส่ง (แถวจะเกิดขึ้นเมื่อใส่เลขพัสดุ)"],
  ["   shipment_id = รหัส · order_id = เลขคำสั่งซื้อ · shipping_company = บริษัทขนส่ง · tracking_number = เลขพัสดุ · shipping_status = สถานะ"],
  ["USERS = สมาชิก (สมัครใหม่จะเข้าแท็บนี้อัตโนมัติ และมีสิทธิ์เฉพาะ customer เท่านั้น ไม่ว่าจะใส่อะไรในชีต)"],
  ["   user_id = รหัสสมาชิก · user_name = ชื่อ-นามสกุล · email = อีเมล (ใช้เข้าสู่ระบบ) · password = รหัสผ่าน"],
  ["   phone = เบอร์โทร · address = ที่อยู่ · user_role = customer (ลูกค้า) หรือ admin (แอดมิน)"],
  [""],
  ["■ ข้อควรระวัง"],
  ["• กด ⬆ อัปโหลด = ข้อมูลใน 6 แท็บด้านบนถูกแทนที่ด้วยข้อมูลจากแอป"],
  ["• ถ้าแท็บไหนถูกลบ ให้กลับไปกด Run ฟังก์ชัน setup อีกครั้ง"],
  ["• ห้ามเปลี่ยนชื่อหัวคอลัมน์ในแถวที่ 1 และห้ามใส่ข้อมูลก่อนหัวคอลัมน์"],
  ["• ตัวอย่างวิธีดูข้อมูล: ตัวกรอง (Data → Create a filter) แล้วเลือก order_status เป็น “รอชำระเงิน” เพื่อดูค้างจ่าย"]
];

const json = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const ss = () => SpreadsheetApp.getActiveSpreadsheet();

/* ---------- ติดตั้ง: สร้างแท็บ + หัวคอลัมน์ + แท็บคู่มือ (รันครั้งเดียว) ---------- */
function setup() {
  const book = ss();

  Object.keys(TAB).forEach(k => {
    let sh = book.getSheetByName(TAB[k]);
    if (!sh) sh = book.insertSheet(TAB[k]);
    headersOf(sh, k);
    sh.getRange("1:1").setFontWeight("bold").setBackground("#f5e3ee");
    sh.setFrozenRows(1);
  });

  /* แท็บสมาชิก (มีข้อมูลเดิมอยู่ก็เก็บไว้ headersOf จะเพิ่มเฉพาะคอลัมน์ที่ขาด) */
  let u = book.getSheetByName(TAB.users);
  if (!u) u = book.insertSheet(TAB.users);
  headersOf(u, "users");
  u.getRange("1:1").setFontWeight("bold").setBackground("#f5e3ee");
  u.setFrozenRows(1);

  /* แท็บคู่มือ */
  let g = book.getSheetByName("คู่มือ");
  if (!g) g = book.insertSheet("คู่มือ");
  g.clear();
  g.getRange(1, 1, GUIDE.length, 1).setValues(GUIDE);
  g.setColumnWidth(1, 720);
  g.getRange("A1").setFontWeight("bold").setFontSize(13);
  book.setActiveSheet(g);
  book.moveActiveSheet(1);

  /* ลบชีตว่างเปล่าที่ค้างอยู่ (เช่น Sheet1 / ชีต1) */
  book.getSheets().forEach(s => {
    if (s.getName() !== "คู่มือ" && s.getLastRow() === 0 && /^(sheet|ชีต)\s*\d*$/i.test(s.getName())) {
      try { if (book.getSheets().length > 1) book.deleteSheet(s); } catch (e) {}
    }
  });
  return "ติดตั้งเรียบร้อย";
}

/** คืนหัวตารางของแท็บ โดยเพิ่มคอลัมน์ที่ยังไม่มีให้เอง (ชีตใหม่ที่ยังว่าง จะเริ่มวางที่คอลัมน์ A) */
function headersOf(sh, key) {
  const h = sh.getLastRow() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
  (NEED[key] || []).forEach(c => {
    if (h.indexOf(c) < 0) { sh.getRange(1, h.length + 1).setValue(c); h.push(c); }
  });
  return h;
}

function tab_(name, key) {
  const sh = ss().getSheetByName(name);
  if (!sh) throw new Error("ไม่พบแท็บ " + name + " — กลับไปรันฟังก์ชัน setup ใน Apps Script ก่อน");
  return sh;
}

/* ---------- อ่าน/เขียนข้อมูล ---------- */
function readTab(name, key) {
  const sh = tab_(name, key), h = headersOf(sh, key), last = sh.getLastRow();
  if (last < 2) return [];
  const v = sh.getRange(2, 1, last - 1, h.length).getDisplayValues();
  return v.filter(r => r.join("").trim() !== "").map(r => { const o = {}; h.forEach((c, i) => { if (c) o[c] = r[i]; }); return o; });
}

/* ---------- แสดงรูปในชีตโดยตรง (เห็นรูปในเซลล์ ไม่ต้องคลิกเปิดลิงก์) ----------
 * แท็บ → คอลัมน์รูปต้นฉบับ + ขนาดรูปที่จะแสดงในเซลล์ (สูง × กว้าง พิกเซล) และความสูงแถวที่ตั้งให้
 * ★ อยากปิดการแสดงรูปของแท็บไหน = เอาคีย์นั้นออก (หรือใส่ h: 0 เพื่อไม่ปรับความสูงแถว)
 * ★ ห้ามพิมพ์ทับคอลัมน์ *_preview เอง เพราะสคริปต์จะเขียนสูตรใหม่ทุกครั้งที่ซิงก์
 */
const PREVIEW = {
  products: { src: "product_image", col: "product_image_preview", h: 110, w: 110 },
  orders:   { src: "slip_image",    col: "slip_preview",           h: 160, w: 120 },
  payments: { src: "slip_image",    col: "slip_preview",           h: 160, w: 120 }
};

/** ตัวคั่นอาร์กิวเมนต์ในสูตรตาม locale ของสเปรดชีต (ไทย/อังกฤษ = , · ยุโรปบางประเทศ = ;) */
let SEP_ = null;
function argSep_() {
  if (SEP_ !== null) return SEP_;
  let loc = "";
  try { loc = ss().getSpreadsheetLocale() || ""; } catch (e) { }
  SEP_ = /^(de|fr|es|it|pt|nl|ru|pl|tr|vi|id|da|cs|sv|fi|nb|el|hu|ro|sk|bg|uk|hr|lt|lv|et|sl|ca|is)/i.test(loc) ? ";" : ",";
  return SEP_;
}

/** แปลง URL รูป → สูตร =IMAGE(...) ให้ชีตแสดงรูปในเซลล์ (คืนข้อความสั้น ๆ ถ้าไม่มีรูปจริง) */
function imgFormula_(url, h, w) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return "— ไม่มีไฟล์รูป (เก็บไว้แค่ชื่อไฟล์) —";   // ออเดอร์เก่า
  const m = /\/d\/([-\w]{20,})/.exec(u) || /[?&]id=([-\w]{20,})/.exec(u);
  const link = m ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1000" : u;   // ลิงก์ Drive → ใช้ endpoint ที่แสดงรูปได้แน่นอน
  const s = argSep_();
  return "=IMAGE(\"" + link + "\"" + s + " 4" + s + " " + (h || 110) + s + " " + (w || 110) + ")";
}

function writeTab(name, key, rows) {
  const sh = tab_(name, key), h = headersOf(sh, key), last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, h.length).clearContent();
  if (!rows.length) return;
  const p = PREVIEW[key], pc = p ? p.col : null;
  const ci = p && pc ? h.indexOf(pc) : -1;
  const v = rows.map(r => {
    const line = h.map(c => (r[c] === undefined || r[c] === null) ? "" : r[c]);
    if (ci >= 0) line[ci] = imgFormula_(r[p.src], p.h, p.w);   // คำนวณจากค่าจริงของแถวนี้ (หลัง merge แล้ว)
    return line;
  });
  sh.getRange(2, 1, v.length, h.length).setValues(v);
  if (ci >= 0 && p.h) { try { sh.setRowHeights(2, v.length, p.h + 12); } catch (e) { } }   // ให้แถวสูงพอดีรูป
}

/** เขียนสูตร "รูปในเซลล์" (slip_preview / product_image_preview) ให้ทุกแถวที่มีอยู่แล้ว
 *  ★ รันด้วยมือครั้งเดียวหลัง Deploy เวอร์ชันนี้ — ใช้เมื่อเปิดชีตแล้วช่องรูปว่าง (เช่น ชีตมีข้อมูลอยู่ก่อนอัปเดตสคริปต์)
 *  ไม่แตะคอลัมน์อื่นเลย เขียนเฉพาะคอลัมน์ *_preview + ปรับความสูงแถว */
function refreshPreviews() {
  const done = [];
  Object.keys(PREVIEW).forEach(key => {
    const sh = tab_(TAB[key], key), h = headersOf(sh, key), p = PREVIEW[key];
    const last = sh.getLastRow();
    const ci = h.indexOf(p.col), si = h.indexOf(p.src);
    if (last < 2 || ci < 0 || si < 0) { done.push(key + ": ไม่มีข้อมูล"); return; }
    const vals = sh.getRange(2, si + 1, last - 1, 1).getDisplayValues();
    sh.getRange(2, ci + 1, vals.length, 1).setValues(vals.map(r => [imgFormula_(r[0], p.h, p.w)]));
    if (p.h) { try { sh.setRowHeights(2, vals.length, p.h + 12); } catch (e) { } }
    done.push(key + ": " + (vals.length) + " แถว");
  });
  const out = "อัปเดตสูตรรูปในชีตแล้ว → " + done.join(" · ");
  Logger.log(out);
  return out;
}

/* ---------- โฟลเดอร์เก็บรูปใน Google Drive ----------
 * ★ ใส่ ID ของโฟลเดอร์ (คัดลอกจากลิงก์ drive.google.com/drive/folders/<ID>) จะแม่นที่สุด
 *   ถ้า id ว่าง หรือเปิดไม่ได้ (ไม่มีสิทธิ์/ถูกลบ) จะค้นจากชื่อ และสร้างให้เองถ้ายังไม่มี
 * ★ โฟลเดอร์ต้องอยู่ใน Drive ของบัญชีที่ Deploy (Execute as: Me) หรือถูกแชร์ให้บัญชีนั้นแบบแก้ไขได้
 */
const FOLDERS = {
  images: { id: "",                                          name: "lukpad-images" },   // รูปสินค้า
  slips:  { id: "1bNa8AbI-92b9MoiEa-9YMJWr83ON26G_",         name: "lukpad-slips" }     // สลิปโอนเงิน (โฟลเดอร์ที่เจ้าของร้านสร้างไว้)
};

function folder_(kind) {
  const f = FOLDERS[kind] || FOLDERS.slips;
  if (f.id) {
    try { return DriveApp.getFolderById(f.id); } catch (e) { }   // ไม่มีสิทธิ์/หาไม่เจอ → ลองวิธีอื่นต่อ
  }
  const it = DriveApp.getFoldersByName(f.name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(f.name);
}

function uploadImage_(kind, prefix, refId, img) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(img || "");
  if (!m) return /^https?:\/\//i.test(img || "") ? img : "";   // เป็นลิงก์อยู่แล้ว หรือไม่มีรูป
  const ext = /^png$/i.test(m[1]) ? "png" : (/webp/i.test(m[1]) ? "webp" : "jpg");
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), "image/" + ext, prefix + "-" + refId + "-" + new Date().getTime() + "." + ext);
  const file = createImageFile_(kind, blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }   // ให้เปิดดูได้จากชีต/แอป (ถ้าตั้งไม่ได้ ก็ยังเก็บไฟล์ไว้)
  return "https://lh3.googleusercontent.com/d/" + file.getId() + "=w1600";
}

/** สร้างไฟล์รูปในโฟลเดอร์ที่ตั้งไว้ — ถ้าเขียนไม่ได้ (ไม่มีสิทธิ์แก้ไข/โฟลเดอร์ถูกลบ) ให้ถอยไปใช้โฟลเดอร์ที่ค้นหรือสร้างตามชื่อแทน */
function createImageFile_(kind, blob) {
  const f = FOLDERS[kind] || FOLDERS.slips;
  if (f.id) {
    try { return DriveApp.getFolderById(f.id).createFile(blob); } catch (e) { }
  }
  const it = DriveApp.getFoldersByName(f.name);
  return (it.hasNext() ? it.next() : DriveApp.createFolder(f.name)).createFile(blob);
}

/* ---------- ตรวจโฟลเดอร์/ทดสอบอัปโหลด (รันจาก Apps Script แล้วดูผลที่ View → Logs) ---------- */
function checkDrive() {
  const out = [];
  ["images", "slips"].forEach(kind => {
    const conf = FOLDERS[kind];
    let folder;
    try {
      folder = folder_(kind);
      out.push("✅ " + kind + " → ใช้ได้: \"" + folder.getName() + "\"  id=" + folder.getId() +
        (conf.id ? (folder.getId() === conf.id ? "  (ตรงกับ ID ที่ตั้งไว้)" : "  (⚠ ใช้ id อื่น เพราะ ID ที่ตั้งไว้เปิดไม่ได้)") : "  (ค้นจากชื่อ)"));
      out.push("     ลิงก์โฟลเดอร์: https://drive.google.com/drive/folders/" + folder.getId());
    } catch (e) {
      out.push("❌ " + kind + " → ใช้ไม่ได้: " + e + "  (ตรวจว่าโฟลเดอร์อยู่ใน Drive ของบัญชีที่ Deploy หรือแชร์ให้บัญชีนั้น)");
      return;
    }
    try {   // อัปไฟล์ทดสอบ 1 พิกเซล เพื่อพิสูจน์ว่าเขียนไฟล์ได้จริง
      const blob = Utilities.newBlob(Utilities.base64Decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=="), "image/png", "test-" + kind + "-" + new Date().getTime() + ".png");
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      out.push("     อัปโหลดทดสอบสำเร็จ → https://lh3.googleusercontent.com/d/" + file.getId() + "=w1600");
    } catch (e) { out.push("     ⚠ เขียนไฟล์ในโฟลเดอร์นี้ไม่ได้: " + e); }
  });
  out.push("");
  out.push("ถ้าเห็น ✅ ทั้งสองบรรทัด = ระบบพร้อมอัปโหลดรูปสินค้า/สลิปแล้ว (ลบไฟล์ test-*.png ทิ้งได้)");
  Logger.log(out.join("\n"));
  return out.join("\n");
}

/* ---------- แถวข้อมูล (ใช้ร่วมกันระหว่าง push ทั้งหมด และอัปเดตทีละออเดอร์) ---------- */
const FLOW_ORDER = ["รอชำระเงิน", "ตรวจสอบชำระเงินแล้ว", "กำลังจัดทำ", "จัดส่งแล้ว", "สำเร็จ"];
const flowRank = s => { const i = FLOW_ORDER.indexOf(s); return i < 0 ? 0 : i + 1; };

function orderRow_(o, now, slipUrl) {
  return {
    order_id: o.id, user_id: o.userId, order_date: o.date, total_amount: o.total,
    order_status: o.status || "รอชำระเงิน", ship_address: o.address || "",
    slip_image: slipUrl || o.slip || "", slip_name: o.slip || "",
    carrier: o.carrier || "", tracking_number: o.tracking || "", updated_at: now
  };
}
function detailRows_(orderId, items, startId) {
  let id = startId;
  return (items || []).map(i => ({
    order_detail_id: id++, order_id: orderId, product_id: i.pid, product_name: i.name,
    quantity: i.qty, unit_price: i.price, custom_note: i.custom || ""
  }));
}
function paymentRow_(row, orderId, nextId) {
  return {
    payment_id: nextId, order_id: orderId, receipt_no: row.slip_name, payment_date: row.order_date,
    payment_amount: row.total_amount, payment_status: "มีสลิป", slip_image: row.slip_image, slip_name: row.slip_name
  };
}
function shipmentRow_(row, orderId, nextId) {
  return {
    shipment_id: nextId, order_id: orderId, shipping_company: row.carrier, tracking_number: row.tracking_number,
    shipping_status: row.order_status, shipping_fee: ""
  };
}
const nextIdOf = (rows, field) => rows.reduce((m, x) => Math.max(m, parseFloat(x[field]) || 0), 0) + 1;

/** สถานะ/เลขพัสดุที่แอดมินคีย์ในชีตเป็นตัวจริง — ลูกค้าอัปเดตทับแล้วต้องไม่ถอยหลัง */
function mergeOrder_(oldRow, newRow) {
  if (!oldRow) return newRow;
  if (String(oldRow.order_status) === "ยกเลิก") newRow.order_status = "ยกเลิก";
  else if (flowRank(oldRow.order_status) > flowRank(newRow.order_status)) newRow.order_status = oldRow.order_status;
  if (oldRow.carrier && !newRow.carrier) newRow.carrier = oldRow.carrier;
  if (oldRow.tracking_number && !newRow.tracking_number) newRow.tracking_number = oldRow.tracking_number;
  if (oldRow.slip_name && !newRow.slip_name) newRow.slip_name = oldRow.slip_name;
  if (/^https?:\/\//i.test(oldRow.slip_image || "") && !/^https?:\/\//i.test(newRow.slip_image || "")) newRow.slip_image = oldRow.slip_image;
  return newRow;
}

/** อัปเดต/เพิ่ม “ออเดอร์เดียว” โดยไม่แตะออเดอร์อื่น (ใช้ตอนลูกค้าสั่งซื้อ/แนบสลิป) */
function upsertOrder_(o, now) {
  const slipUrl = uploadImage_("slips", "slip", o.id, o.slipImg);

  const orders = readTab(TAB.orders, "orders");
  const idx = orders.findIndex(x => String(x.order_id) === String(o.id));
  const row = mergeOrder_(idx >= 0 ? orders[idx] : null, orderRow_(o, now, slipUrl));
  if (idx >= 0) orders[idx] = row; else orders.push(row);
  writeTab(TAB.orders, "orders", orders);

  const details = readTab(TAB.details, "details").filter(x => String(x.order_id) !== String(o.id));
  writeTab(TAB.details, "details", details.concat(detailRows_(o.id, o.items, nextIdOf(details, "order_detail_id"))));

  const pays = readTab(TAB.payments, "payments").filter(x => String(x.order_id) !== String(o.id));
  if (row.slip_image || row.slip_name) pays.push(paymentRow_(row, o.id, nextIdOf(pays, "payment_id")));
  writeTab(TAB.payments, "payments", pays);

  const ships = readTab(TAB.shipments, "shipments").filter(x => String(x.order_id) !== String(o.id));
  if (row.tracking_number) ships.push(shipmentRow_(row, o.id, nextIdOf(ships, "shipment_id")));
  writeTab(TAB.shipments, "shipments", ships);

  return { id: o.id, img: /^https?:\/\//i.test(row.slip_image) ? row.slip_image : "" };
}

/* ---------- GET: ดึงข้อมูลทั้งหมดจากชีต ---------- */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "list";
    if (action !== "list") return json({ ok: true });
    return json({
      ok: true,
      version: 2,   // ใช้ให้แอปตรวจว่าสคริปต์ที่ deploy ใหม่แล้วหรือยัง (2 = รองรับ action "order")
      users: readTab(TAB.users, "users"),
      products: readTab(TAB.products, "products"),
      orders: readTab(TAB.orders, "orders"),
      details: readTab(TAB.details, "details"),
      payments: readTab(TAB.payments, "payments"),
      shipments: readTab(TAB.shipments, "shipments")
    });
  } catch (err) { return json({ ok: false, error: String(err) }); }
}

/* ---------- POST: อัปโหลดข้อมูลจากแอปขึ้นชีต ---------- */
function doPost(e) {
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || "{}");
    const now = new Date().toISOString();

    /* สมาชิก: action=users = ส่งเฉพาะสมาชิก (ใช้ตอนมีคนสมัครใหม่) */
    const usersRows = u => (u || []).map(x => ({
      user_id: x.id, user_name: x.name, email: x.email, password: x.password || "", phone: x.phone || "", address: x.address || "",
      user_role: (x.role === "admin" ? "admin" : "customer")
    }));
    if (d.action === "users") { writeTab(TAB.users, "users", usersRows(d.users)); return json({ ok: true, users: (d.users || []).length }); }
    /* อัปเดตออเดอร์ทีละใบ (ลูกค้าสั่งซื้อ/แนบสลิป/แอดมินเปลี่ยนสถานะ) */
    if (d.action === "order") {
      const o = d.order || {};
      const slip = upsertOrder_(o, now);
      return json({ ok: true, slips: [slip], images: [], order: o.id });
    }

    if (d.action !== "push") return json({ ok: false, error: "action ต้องเป็น push, users หรือ order เท่านั้น" });

    writeTab(TAB.users, "users", usersRows(d.users));

    /* สินค้า (รูป base64 ถูกส่งเข้า Drive แล้วแทนที่ด้วยลิงก์) */
    const products = (d.products || []).map(p => ({
      product_id: p.id, product_name: p.name, category: p.category || "", product_image: uploadImage_("images", "product", p.id, p.img),
      price: p.price, shipping_fee: p.ship, size: p.size || "", description: p.desc || "",
      is_customizable: p.custom ? 1 : 0, updated_at: now
    }));
    writeTab(TAB.products, "products", products);

    /* คำสั่งซื้อ + รายละเอียด + การชำระเงิน (สลิป) + การจัดส่ง */
    const orders = d.orders || [];
    const prevRows = readTab(TAB.orders, "orders");
    const slips = [];
    const orderRows = orders.map(o => {
      const slipUrl = uploadImage_("slips", "slip", o.id, o.slipImg);   // อัปสลิปเข้า Drive ให้เปิดดูได้จากชีต
      /* ★ ต้องใช้ผลลัพธ์จาก mergeOrder_ (เดิมทิ้งค่าไป ทำให้สถานะ/ลิงก์สลิปที่แอดมินมีอยู่ถูกเขียนทับหาย) */
      const row = mergeOrder_(prevRows.find(x => String(x.order_id) === String(o.id)), orderRow_(o, now, slipUrl));
      slips.push({ id: o.id, img: /^https?:\/\//i.test(row.slip_image) ? row.slip_image : "" });
      return row;
    });
    writeTab(TAB.orders, "orders", orderRows);

    const details = [];
    orders.forEach(o => details.push.apply(details, detailRows_(o.id, o.items, details.length + 1)));
    const pays = [];
    orders.forEach((o, i) => { if (o.slip || o.slipImg) pays.push(paymentRow_(orderRows[i], o.id, pays.length + 1)); });
    const ships = [];
    orders.forEach((o, i) => { if (orderRows[i].tracking_number) ships.push(shipmentRow_(orderRows[i], o.id, ships.length + 1)); });
    writeTab(TAB.details, "details", details);
    writeTab(TAB.payments, "payments", pays);
    writeTab(TAB.shipments, "shipments", ships);

    /* คืนลิงก์รูปใหม่ (สินค้า + สลิป) ให้แอปนำไปเก็บในเครื่องแทน base64 */
    const images = products.map(p => ({ id: p.product_id, img: p.product_image }));
    return json({ ok: true, images: images, slips: slips, products: products.length, orders: orders.length });
  } catch (err) { return json({ ok: false, error: String(err) }); }
}
