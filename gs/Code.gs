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
 *
 * ★ ถ้าแก้สคริปต์ครั้งหลัง: Deploy → Manage deployments → ✎ Edit → Version: New version (ใช้ URL เดิมได้เลย)
 *
 * ★ หมายเหตุ
 * - แท็บ USERS อ่านได้แต่แอปจะไม่เขียนทับ (ยังเก็บสมาชิกในเครื่อง)
 * - ข้อมูลที่จะถูกเขียนทับเมื่อกด "อัปโหลดขึ้นชีต": PRODUCTS, ORDERS, ORDER_DETAILS, PAYMENTS, SHIPMENTS
 * - รูปสินค้าจะเข้า Google Drive โฟลเดอร์ "lukpad-images" แล้วนำลิงก์ไปใส่คอลัมน์ product_image
 */

const TAB = { users: "USERS", products: "PRODUCTS", orders: "ORDERS", details: "ORDER_DETAILS", payments: "PAYMENTS", shipments: "SHIPMENTS" };

/* หัวคอลัมน์ที่ต้องมีของแต่ละแท็บ (ขาดอันไหน setup จะเพิ่มให้เอง) */
const NEED = {
  users: ["user_id", "user_name", "email", "password", "phone", "address", "user_role"],
  products: ["product_id", "product_name", "category", "product_image", "price", "shipping_fee", "size", "description", "is_customizable", "updated_at"],
  orders: ["order_id", "user_id", "order_date", "total_amount", "order_status", "ship_address", "slip_image", "carrier", "tracking_number", "updated_at"],
  details: ["order_detail_id", "order_id", "product_id", "product_name", "quantity", "unit_price", "custom_note"],
  payments: ["payment_id", "order_id", "receipt_no", "payment_date", "payment_amount", "payment_status"],
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
  ["■ แท็บต่าง ๆ และคอลัมน์"],
  ["PRODUCTS = ข้อมูลสินค้า"],
  ["   product_id = รหัสสินค้า · product_name = ชื่อสินค้า · category = ประเภท"],
  ["   product_image = ลิงก์รูป (แอปอัปโหลดเข้า Google Drive ให้เอง) · price = ราคา · shipping_fee = ค่าจัดส่ง"],
  ["   size = ขนาด · description = รายละเอียด · is_customizable = เปิดให้ปรับแต่ง (1=ได้, 0=ไม่) · updated_at = วันเวลาที่อัปเดตล่าสุด"],
  ["ORDERS = คำสั่งซื้อ (1 แถว = 1 ใบสั่งซื้อ)"],
  ["   order_id = เลขคำสั่งซื้อ · user_id = รหัสสมาชิก · order_date = วันที่สั่ง · total_amount = ยอดรวม"],
  ["   order_status = สถานะ (รอชำระเงิน / ตรวจสอบชำระเงินแล้ว / กำลังจัดทำ / จัดส่งแล้ว / สำเร็จ / ยกเลิก)"],
  ["   ship_address = ที่อยู่จัดส่ง · slip_image = ชื่อไฟล์สลิป · carrier = บริษัทขนส่ง · tracking_number = เลขพัสดุ · updated_at = วันเวลาที่อัปเดต"],
  ["ORDER_DETAILS = รายการสินค้าในแต่ละคำสั่งซื้อ (1 แถว = 1 รายการ)"],
  ["   order_detail_id = รหัสแถว · order_id = เลขคำสั่งซื้อ · product_id = รหัสสินค้า · product_name = ชื่อสินค้า ณ วันสั่งซื้อ"],
  ["   quantity = จำนวน · unit_price = ราคาต่อหน่วย · custom_note = ตัวเลือกปรับแต่ง (เช่น “สี: ชมพู, ขนาด: M”)"],
  ["PAYMENTS = การชำระเงิน (แถวจะเกิดขึ้นเมื่อลูกค้าแนบสลิป)"],
  ["   payment_id = รหัส · order_id = เลขคำสั่งซื้อ · receipt_no = ชื่อไฟล์สลิป · payment_date = วันที่โอน · payment_amount = จำนวนเงิน · payment_status = สถานะ"],
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

function writeTab(name, key, rows) {
  const sh = tab_(name, key), h = headersOf(sh, key), last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, h.length).clearContent();
  if (!rows.length) return;
  const v = rows.map(r => h.map(c => (r[c] === undefined || r[c] === null) ? "" : r[c]));
  sh.getRange(2, 1, v.length, h.length).setValues(v);
}

/* ---------- รูปสินค้า: base64 จากแอป → Google Drive → คืนลิงก์ไปใส่ชีต ---------- */
function imageFolder_() {
  const it = DriveApp.getFoldersByName("lukpad-images");
  return it.hasNext() ? it.next() : DriveApp.createFolder("lukpad-images");
}

function uploadImage_(productId, img) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(img || "");
  if (!m) return img || "";                 // ไม่ใช่ base64 = เป็น URL อยู่แล้ว เก็บไว้ตามเดิม
  const ext = /^png$/i.test(m[1]) ? "png" : (/webp/i.test(m[1]) ? "webp" : "jpg");
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), "image/" + ext, "product-" + productId + "-" + new Date().getTime() + "." + ext);
  const file = imageFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);   // ให้ลูกค้าดูรูปได้
  return "https://lh3.googleusercontent.com/d/" + file.getId() + "=w1000";
}

/* ---------- GET: ดึงข้อมูลทั้งหมดจากชีต ---------- */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "list";
    if (action !== "list") return json({ ok: true });
    return json({
      ok: true,
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
    if (d.action !== "push") return json({ ok: false, error: "action ต้องเป็น push หรือ users เท่านั้น" });

    writeTab(TAB.users, "users", usersRows(d.users));

    /* สินค้า (รูป base64 ถูกส่งเข้า Drive แล้วแทนที่ด้วยลิงก์) */
    const products = (d.products || []).map(p => ({
      product_id: p.id, product_name: p.name, category: p.category || "", product_image: uploadImage_(p.id, p.img),
      price: p.price, shipping_fee: p.ship, size: p.size || "", description: p.desc || "",
      is_customizable: p.custom ? 1 : 0, updated_at: now
    }));
    writeTab(TAB.products, "products", products);

    /* คำสั่งซื้อ + รายละเอียด + การชำระเงิน + การจัดส่ง */
    const orders = d.orders || [];
    writeTab(TAB.orders, "orders", orders.map(o => ({
      order_id: o.id, user_id: o.userId, order_date: o.date, total_amount: o.total, order_status: o.status || "รอชำระเงิน",
      ship_address: o.address || "", slip_image: o.slip || "", carrier: o.carrier || "", tracking_number: o.tracking || "", updated_at: now
    })));

    let dn = 1; const details = [], pays = [], ships = [];
    orders.forEach(o => (o.items || []).forEach(i => details.push({
      order_detail_id: dn++, order_id: o.id, product_id: i.pid, product_name: i.name,
      quantity: i.qty, unit_price: i.price, custom_note: i.custom || ""
    })));
    orders.forEach(o => {
      if (o.slip) pays.push({ payment_id: pays.length + 1, order_id: o.id, receipt_no: o.slip, payment_date: o.date, payment_amount: o.total, payment_status: "มีสลิป" });
      if (o.tracking) ships.push({ shipment_id: ships.length + 1, order_id: o.id, shipping_company: o.carrier || "", tracking_number: o.tracking, shipping_status: o.status || "", shipping_fee: "" });
    });
    writeTab(TAB.details, "details", details);
    writeTab(TAB.payments, "payments", pays);
    writeTab(TAB.shipments, "shipments", ships);

    /* คืนลิงก์รูปใหม่ให้แอปนำไปเก็บในเครื่องลูกค้าด้วย */
    return json({ ok: true, images: products.map(p => ({ id: p.product_id, img: p.product_image })), products: products.length, orders: orders.length });
  } catch (err) { return json({ ok: false, error: String(err) }); }
}
