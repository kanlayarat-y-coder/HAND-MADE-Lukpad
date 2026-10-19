/* ---------- Admin ---------- */
function adminControls(o){
 return `<form class="row" data-ord="${o.id}" style="align-items:flex-end"><div><label>สถานะ</label><select name="status">${[...FLOW,"ยกเลิก"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></div>
 <div><label>ขนส่ง</label><input name="carrier" value="${esc(o.carrier)}" placeholder="ไปรษณีย์ไทย"></div>
 <div><label>เลขพัสดุ</label><input name="tracking" value="${esc(o.tracking)}"></div><button class="pri">อัปเดต</button></form>`;
}
function vAOrders(){
 const all=[...DB.orders].reverse();
 return `<h2>จัดการคำสั่งซื้อ</h2><p class="mute">เฉพาะแอดมินที่เปลี่ยนสถานะและใส่เลขพัสดุได้</p>`+(all.length?all.map(o=>orderCard(o,true)).join(""):`<p class="mute">ยังไม่มีคำสั่งซื้อ</p>`);
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
 <p style="margin-top:10px"><button class="pri" data-act="sheet-save">บันทึกลิงก์</button> <button data-act="sheet-test">ทดสอบการเชื่อมต่อ</button></p>
 <p class="mute">ลิงก์นี้จะถูกจำไว้เฉพาะเบราว์เซอร์เครื่องนี้ · ถ้าจะให้ <b>ทุกเครื่อง/ลูกค้าทุกคน</b> ซิงก์กับชีตเดียวกัน ให้วางลิงก์ไว้ในไฟล์ <code>js/config.js</code> ที่ตัวแปร <code>SHEET_URL</code> แล้ว deploy เว็บใหม่</p>
 <p class="mute"><b>ติดตั้งบนสเปรดชีตใหม่ (ครั้งเดียว):</b><br>1. สร้างสเปรดชีตใหม่ (sheets.new) → ส่วนขยาย → Apps Script → วางไฟล์ <code>gs/Code.gs</code> → Save<br>2. เลือกฟังก์ชัน <b>setup</b> แล้วกด Run (▶) — จะสร้างแท็บ USERS / PRODUCTS / ORDERS / ORDER_DETAILS / PAYMENTS / SHIPMENTS / คู่มือ ให้เอง<br>3. Deploy → New deployment → Web app (Execute as: Me, Access: Anyone) → คัดลอก URL มาวางที่นี่</p></div>
 <div class="card" style="margin-top:12px"><b>2. อัปเดตข้อมูล</b>
 <p class="mute">⬆ อัปโหลด = ส่งสมาชิก/สินค้า/คำสั่งซื้อจากแอปไปเขียนลงชีต (แท็บ USERS, PRODUCTS, ORDERS, ORDER_DETAILS, PAYMENTS, SHIPMENTS) · รูปสินค้าจะเข้า Google Drive แล้วใส่ลิงก์ใน product_image<br>⬇ ดึงข้อมูล = อ่านจากชีตมาทับข้อมูลในแอป</p>
 <p><button class="pri" data-act="sheet-push">⬆ อัปโหลดขึ้นชีต</button> <button data-act="sheet-pull">⬇ ดึงข้อมูลจากชีต</button></p>
 <p class="mute">สมาชิกที่สมัครใหม่จะถูกส่งขึ้นแท็บ USERS ให้อัตโนมัติทันที (เมื่อเชื่อมต่อลิงก์แล้ว)</p>
 <p class="mute">ข้อมูลในแอปเก็บอยู่ในเบราว์เซอร์เครื่องนั้น ๆ การกดปุ่มทั้งสองจึงเป็นการเลือกว่าจะให้ฝั่งไหนเป็นตัวจริงในขณะนั้น</p></div>`;
}
function vAUsers(){
 return `<h2>สมาชิก</h2><div class="card scroll"><table><tr><th>รหัส</th><th>ชื่อ</th><th>อีเมล</th><th>โทร</th><th>สิทธิ์</th></tr>`+DB.users.map(u=>`<tr><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${u.role}</td></tr>`).join("")+`</table></div>`;
}
