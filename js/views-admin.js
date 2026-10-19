/* ---------- Admin ---------- */
function adminControls(o){
 return `<form class="row" data-ord="${o.id}" style="align-items:flex-end"><div><label>สถานะ</label><select name="status">${[...FLOW,"ยกเลิก"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></div>
 <div><label>ขนส่ง</label><input name="carrier" value="${esc(o.carrier)}" placeholder="ไปรษณีย์ไทย"></div>
 <div><label>เลขพัสดุ</label><input name="tracking" value="${esc(o.tracking)}"></div><button class="pri">อัปเดต</button></form>
 <div class="mute" style="margin-top:6px"><label>แนบ/เปลี่ยนสลิป (แอดมินทำได้ทุกสถานะ — เช่น ลูกค้าส่งสลิปมาทาง LINE)</label><input type="file" accept="image/*" data-slip="${o.id}"></div>`;
}
function vAOrders(){
 const all0=[...DB.orders].reverse();
 const withSlip=all0.filter(o=>o.slipImg||o.slip).length;
 const wait=all0.filter(o=>o.status==="รอชำระเงิน").length;
 const all=S.slipOnly?all0.filter(o=>o.slipImg||o.slip):all0;
 const unsent=all0.filter(o=>o.synced!==true).length;
 const counts=FLOW.map(s=>s+" "+all0.filter(o=>o.status===s).length).join(" · ");
 return `<h2>จัดการคำสั่งซื้อ</h2>
 <div class="card" style="margin-bottom:12px"><div class="row"><b>รวม ${all0.length} ใบ</b>
  <span class="tag warn">รอชำระเงิน ${wait}</span><span class="tag ok">แนบสลิปแล้ว ${withSlip}</span>
  <button style="margin-left:auto" data-act="sliponly">${S.slipOnly?"✓ แสดงเฉพาะที่มีสลิป":"แสดงเฉพาะที่มีสลิป"}</button></div>
  <div class="row" style="margin-top:8px">
   <button data-act="refresh">อัปเดตเดี๋ยวนี้</button>
   <button data-act="auto">${S.auto===false?"⏸ อัปเดตอัตโนมัติ: ปิด":"⟳ อัปเดตอัตโนมัติ: เปิด (ทุก 20 วินาที)"}</button>
   <span class="mute">อัปเดตล่าสุด: ${typeof lastSync!=="undefined"&&lastSync?lastSync:"—"}</span>
   ${sheetUrl?"":`<span class="tag warn">ยังไม่ได้ตั้งลิงก์ชีต</span>`}
   ${typeof sheetVersion!=="undefined"&&sheetVersion>0&&sheetVersion<2?`<span class="tag warn">สคริปต์ในชีตเป็นเวอร์ชันเก่า — วาง gs/Code.gs ใหม่แล้ว Deploy ใหม่</span>`:""}
   ${unsent?`<span class="tag warn">ยังไม่ส่งขึ้นชีต ${unsent} ใบ (จะลองใหม่เอง)</span>`:`<span class="tag ok">ส่งขึ้นชีตครบแล้ว</span>`}
  </div>
  <div class="mute" style="margin-top:6px">${counts}</div>
  <div class="mute">ออเดอร์/สลิปที่ลูกค้าส่งมาจะเด้งเข้ามาเองภายใน ~20 วินาที · เปิดสลิปได้จากรูปในใบสั่งซื้อ หรือกด “เปิดสลิปขนาดเต็ม” (ลิงก์ Drive อยู่ในแท็บ ORDERS/PAYMENTS คอลัมน์ slip_image) · <b>ในชีตก็เห็นรูปสลิปในเซลล์เลย</b> ที่คอลัมน์ <code>slip_preview</code>${typeof SLIP_FOLDER_URL!=="undefined"&&SLIP_FOLDER_URL?` · <a href="${esc(SLIP_FOLDER_URL)}" target="_blank" rel="noopener">📁 เปิดโฟลเดอร์สลิปใน Drive</a>`:""}</div></div>`+
 (all.length?all.map(o=>orderCard(o,true)).join(""):`<p class="mute">${S.slipOnly?"ยังไม่มีคำสั่งซื้อที่แนบสลิป":"ยังไม่มีคำสั่งซื้อ"}</p>`);
}
function vAProducts(){
 const p=S.sel?DB.products.find(x=>x.id===S.sel):null;
 return `<h2>จัดการสินค้า</h2><form id="f-prod" class="card"><b>${p?"แก้ไขสินค้า #"+p.id:"เพิ่มสินค้าใหม่"}</b><div class="row">
 <div><label>ชื่อสินค้า</label><input name="name" required value="${esc(p?.name)}"></div><div><label>ประเภท</label><input name="category" value="${esc(p?.category)}"></div>
 <div><label>ไอคอน</label><input name="icon" maxlength="2" value="${esc(p?.icon||"📿")}" style="width:70px"></div>
 <div><label>ราคา</label><input name="price" type="number" min="0" required value="${p?.price??""}" style="width:100px"></div>
 <div><label>ค่าจัดส่ง</label><input name="ship" type="number" min="0" value="${p?.ship??59}" style="width:100px"></div>
 <div><label>ขนาด</label><input name="size" value="${esc(p?.size)}"></div></div>
 <label>รายละเอียดสินค้า</label><textarea name="desc" rows="3">${esc(p?.desc)}</textarea>
 <div class="row" style="align-items:flex-start;margin-top:6px">
  <div style="flex:1;min-width:200px"><label>ภาพสินค้า</label><input type="file" accept="image/*" data-pimg="1">
  <div class="mute">รองรับ JPG/PNG — รูปจะถูกย่อขนาดอัตโนมัติ และเมื่อกด “อัปโหลดขึ้นชีต” จะเข้า Google Drive ให้เอง</div>
  <p style="margin:8px 0 0"><input type="hidden" name="img" id="pimg-val" value="${esc(p?.img||"")}"><button type="button" class="dng" data-act="clrpimg">ลบรูปภาพ</button></p></div>
  <div class="ph" id="pimg-prev" style="width:130px;height:130px;font-size:44px;margin:0">${pImg(p)}</div>
 </div>
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="custom" style="width:auto" ${p?.custom?"checked":""}> เปิดให้ปรับแต่งสินค้า</label>
 <p><button class="pri">${p?"บันทึกการแก้ไข":"เพิ่มสินค้า"}</button> ${p?`<button type="button" data-go="a-products">ยกเลิก</button>`:""}</p></form>
 <div class="card scroll" style="margin-top:12px"><table><tr><th>รหัส</th><th>รูป</th><th>ชื่อ</th><th>ราคา</th><th>ปรับแต่ง</th><th></th></tr>`+DB.products.map(x=>`<tr><td>${x.id}</td><td><span class="thumb">${pImg(x)}</span></td><td>${esc(x.name)}<div class="mute">${esc(x.category)}${x.desc?" · "+esc(x.desc).slice(0,40):""}</div></td><td>${baht(x.price)}</td><td>${x.custom?"ได้":"-"}</td><td><button data-go="a-products" data-id="${x.id}">แก้ไข</button> <button class="dng" data-act="delp" data-id="${x.id}">ลบ</button></td></tr>`).join("")+`</table></div>`;
}
function vASync(){
 const localFile=typeof location!=="undefined"&&location.protocol==="file:";
 return `<h2>ซิงก์ Google Sheet</h2>
 ${localFile?`<div class="card" style="background:var(--soft)"><b>⚠️ เปิดจากไฟล์ในเครื่อง (file://)</b><div class="mute">เบราว์เซอร์บางตัวจะบล็อกการเชื่อมต่อกับ Apps Script — แนะนำให้ใช้งานผ่านเว็บ (https) เช่น host ฟรีที่ GitHub Pages / Netlify / Vercel แล้วค่อยกดซิงก์ (ดูวิธีใน README)</div></div>`:""}
 <div class="card"><b>1. เชื่อมต่อ</b><label>Web App URL (จาก Apps Script → Deploy → Web app)</label>
 <input id="sheet-url" value="${esc(sheetUrl)}" placeholder="https://script.google.com/macros/s/…/exec">
 ${typeof sheetVersion!=="undefined"&&sheetVersion>0&&sheetVersion<2?`<p class="mute" style="background:#fff3f3;padding:8px;border-radius:8px"><b>⚠️ สคริปต์ในชีตเป็นเวอร์ชันเก่า:</b> โค้ดที่ deploy ไว้ยังไม่รองรับการส่งออเดอร์/สลิปทีละใบ — ให้วางไฟล์ <code>gs/Code.gs</code> ทับของเดิมใน Apps Script แล้วกด Deploy → Manage deployments → Edit (ไอคอนดินสอ) → Version: New version → Deploy (ลิงก์เดิมใช้ได้ต่อ)</p>`:""}
 <p style="margin-top:10px"><button class="pri" data-act="sheet-save">บันทึกลิงก์</button> <button data-act="sheet-test">ทดสอบการเชื่อมต่อ</button></p>
 <p class="mute">ลิงก์นี้จะถูกจำไว้เฉพาะเบราว์เซอร์เครื่องนี้ · ถ้าจะให้ <b>ทุกเครื่อง/ลูกค้าทุกคน</b> ซิงก์กับชีตเดียวกัน ให้วางลิงก์ไว้ในไฟล์ <code>js/config.js</code> ที่ตัวแปร <code>SHEET_URL</code> แล้ว deploy เว็บใหม่</p>
 <p class="mute"><b>ติดตั้งบนสเปรดชีตใหม่ (ครั้งเดียว):</b><br>1. สร้างสเปรดชีตใหม่ (sheets.new) → ส่วนขยาย → Apps Script → วางไฟล์ <code>gs/Code.gs</code> → Save<br>2. เลือกฟังก์ชัน <b>setup</b> แล้วกด Run (▶) — จะสร้างแท็บ USERS / PRODUCTS / ORDERS / ORDER_DETAILS / PAYMENTS / SHIPMENTS / คู่มือ ให้เอง<br>3. Deploy → New deployment → Web app (Execute as: Me, Access: Anyone) → คัดลอก URL มาวางที่นี่</p></div>
 <div class="card" style="margin-top:12px"><b>2. อัปเดตข้อมูล</b>
 <p class="mute">⬆ อัปโหลด = ส่งสมาชิก/สินค้า/คำสั่งซื้อจากแอปไปเขียนลงชีต (แท็บ USERS, PRODUCTS, ORDERS, ORDER_DETAILS, PAYMENTS, SHIPMENTS) · รูปสินค้า/สลิปจะเข้า Google Drive แล้วใส่ลิงก์ใน product_image / slip_image<br>⬇ ดึงข้อมูล = อ่านจากชีตมาทับข้อมูลในแอป</p>
 <p class="mute"><b>เห็นรูปในชีตเลย:</b> คอลัมน์ <code>slip_preview</code> (ORDERS, PAYMENTS) และ <code>product_image_preview</code> (PRODUCTS) เป็นสูตร <code>=IMAGE(...)</code> ที่ระบบเขียนให้อัตโนมัติ → เปิดชีตแล้วเห็นรูปสลิป/รูปสินค้าในเซลล์ทันที (แถวถูกปรับความสูงให้เอง)</p>
 <p><button class="pri" data-act="sheet-push">⬆ อัปโหลดขึ้นชีต</button> <button data-act="sheet-pull">⬇ ดึงข้อมูลจากชีต</button></p>
 <p class="mute">สมาชิกที่สมัครใหม่จะถูกส่งขึ้นแท็บ USERS ให้อัตโนมัติทันที (เมื่อเชื่อมต่อลิงก์แล้ว)</p>
 <p class="mute">ข้อมูลในแอปเก็บอยู่ในเบราว์เซอร์เครื่องนั้น ๆ การกดปุ่มทั้งสองจึงเป็นการเลือกว่าจะให้ฝั่งไหนเป็นตัวจริงในขณะนั้น</p>
 <p class="mute">โฟลเดอร์เก็บสลิปใน Drive: ${typeof SLIP_FOLDER_URL!=="undefined"&&SLIP_FOLDER_URL?`<a href="${esc(SLIP_FOLDER_URL)}" target="_blank" rel="noopener">📁 เปิดโฟลเดอร์สลิปใน Drive</a>`:"ยังไม่ได้ตั้งค่า (ใส่ SLIP_FOLDER_URL ใน js/config.js)"} · รูปสินค้า/สลิปจะถูกส่งเข้าโฟลเดอร์ที่ตั้งไว้ในตัวแปร <code>FOLDERS</code> ของ <code>gs/Code.gs</code></p></div>
 <div class="card" style="margin-top:12px"><b>3. ซิงก์อัตโนมัติ (ใกล้เรียลไทม์)</b>
 <p class="mute">ระบบทำงานให้อัตโนมัติเมื่อเชื่อมต่อไว้:<br>
 · ลูกค้าสั่งซื้อ / แนบสลิป → ส่งขึ้นชีต <b>ทันที</b> (ออเดอร์เดียว ไม่ทับข้อมูลอื่น)<br>
 · หน้า <b>จัดการคำสั่งซื้อ</b> ของแอดมินจะดึงข้อมูลใหม่เองทุก <b>20 วินาที</b> → ออเดอร์/สลิปใหม่เด้งเข้ามาเอง (มีปุ่ม “อัปเดตเดี๋ยวนี้” และปุ่มปิดการอัปเดตอัตโนมัติ)<br>
 · หน้าคำสั่งซื้อลูกค้าก็อัปเดตสถานะเองทุก ~20 วินาที หลังแอดมินเปลี่ยนสถานะ<br>
 · ออเดอร์ที่ส่งขึ้นชีตไม่สำเร็จ (เน็ตหลุด) จะถูกเก็บไว้ในเครื่องและลองส่งใหม่เองทุก ๆ 20 วินาที<br>
 · ขึ้นอยู่กับว่าเปิดหน้าเว็บค้างไว้ — สถานะแท็บถูกซ่อน (tab ไม่ได้เปิดอยู่) จะหยุดรอเพื่อประหยัดทราฟฟิก</p></div>`;
}
function vAUsers(){
 return `<h2>สมาชิก</h2><div class="card scroll"><table><tr><th>รหัส</th><th>ชื่อ</th><th>อีเมล</th><th>โทร</th><th>สิทธิ์</th></tr>`+DB.users.map(u=>`<tr><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${u.role}</td></tr>`).join("")+`</table></div>`;
}
