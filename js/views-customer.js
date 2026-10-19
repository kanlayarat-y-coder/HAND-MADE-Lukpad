/* ---------- Customer ---------- */
function vShop(){
 return `<h2>สินค้าแนะนำ</h2>${S.me?"":`<div class="card" style="background:var(--soft);margin-bottom:12px">คุณกำลังดูใน <b>โหมดผู้เยี่ยมชม</b> — ดูรายละเอียดสินค้าได้ทุกชิ้น แต่ต้องลงทะเบียน/เข้าสู่ระบบก่อนจึงจะเพิ่มลงตะกร้าและสั่งซื้อได้ <button class="pri" data-go="login">เข้าสู่ระบบ / สมัครสมาชิก</button></div>`}<div class="grid">`+DB.products.map(p=>`<div class="card"><div class="ph">${pImg(p)}</div><b>${esc(p.name)}</b><div class="mute">${esc(p.category)} · ${esc(p.size)}</div><p class="price">${baht(p.price)}</p><button class="pri" data-go="detail" data-id="${p.id}">ดูรายละเอียด</button></div>`).join("")+`</div>`;
}
function vDetail(){
 const p=DB.products.find(x=>x.id===S.sel);
 if(!p)return `<h2>ไม่พบสินค้า</h2><button class="pri" data-go="shop">กลับไปหน้าสินค้า</button>`;
 const sel=(n,a)=>`<label>${n}</label><select name="${n}"><option value="">ไม่เลือก</option>${a.map(o=>`<option>${o}</option>`).join("")}</select>`;
 const add=S.me?`<form id="f-add"><input type="hidden" name="pid" value="${p.id}">
  <label>จำนวน</label><input name="qty" type="number" min="1" value="1" style="max-width:100px">
  ${p.custom?`<h3>ปรับแต่งสินค้า (ตัวเลือกละ ${CUSTOM_FEE} บาท)</h3>${sel("สี",CUSTOM.color)}${sel("ขนาด",CUSTOM.size)}${sel("ลาย",CUSTOM.pattern)}<label>ตัวอักษร (A–Z, ก–ฮ)</label><input name="ตัวอักษร" maxlength="1" style="max-width:100px">`:""}
  <p><button class="pri">เพิ่มลงตะกร้า</button></p></form>`
  :`<div class="card" style="background:var(--soft)"><b>ต้องลงทะเบียน/เข้าสู่ระบบก่อนจึงจะสั่งซื้อได้</b><div class="mute">ตอนนี้คุณดูสินค้าในโหมดผู้เยี่ยมชม</div><p><button class="pri" data-go="login">เข้าสู่ระบบ / สมัครสมาชิก</button></p></div>`;
 return `<button data-go="shop">กลับ</button><div class="card" style="margin-top:12px"><div class="row"><div class="ph" style="width:180px;height:180px;font-size:70px">${pImg(p)}</div><div style="flex:1;min-width:220px"><h2>${esc(p.name)}</h2><div class="mute">${esc(p.category)}</div><p>${esc(p.desc)}</p><p class="mute">ขนาด ${esc(p.size)} · ค่าจัดส่ง ${baht(p.ship)}</p><p class="price">${baht(p.price)}</p></div></div>
 ${add}</div>`;
}
function lineFee(i){return i.custom?Object.values(i.custom).filter(Boolean).length*CUSTOM_FEE*i.qty:0}
function totals(items){
 const goods=items.reduce((s,i)=>s+i.price*i.qty,0),cf=items.reduce((s,i)=>s+lineFee(i),0);
 const ship=items.length?Math.max(...items.map(i=>i.ship)):0;
 return {goods,cf,ship,total:goods+cf+ship};
}
function customText(c){return c?Object.entries(c).filter(([,v])=>v).map(([k,v])=>k+": "+v).join(", "):""}
function vCart(){
 if(!S.cart.length)return `<h2>ตะกร้าสินค้า</h2><p class="mute">ยังไม่มีสินค้า เลือกสินค้าที่ชอบได้ที่หน้าสินค้า</p><button class="pri" data-go="shop">ดูสินค้า</button>`;
 const t=totals(S.cart);
 return `<h2>ตะกร้าสินค้า</h2><div class="card scroll"><table><tr><th>สินค้า</th><th>จำนวน</th><th>ราคา</th><th></th></tr>`+S.cart.map((i,x)=>`<tr><td>${esc(i.name)}<div class="mute">${esc(customText(i.custom))}</div></td><td>${i.qty}</td><td>${baht(i.price*i.qty+lineFee(i))}</td><td><button class="dng" data-act="rm" data-i="${x}">ลบ</button></td></tr>`).join("")+`</table></div>
 <p>ค่าสินค้า ${baht(t.goods)} · ค่าปรับแต่ง ${baht(t.cf)} · ค่าจัดส่ง ${baht(t.ship)}</p><h3>รวม ${baht(t.total)}</h3>
 <form id="f-checkout"><label>ที่อยู่จัดส่ง</label><textarea name="address" rows="2" required>${esc(S.me.address)}</textarea><p><button class="pri">ยืนยันคำสั่งซื้อ</button></p></form>`;
}
function timeline(o){
 const k=FLOW.indexOf(o.status);
 if(o.status==="ยกเลิก")return `<span class="tag bad">ยกเลิก</span>`;
 return `<div class="steps">`+FLOW.map((s,i)=>`<div class="step ${i<=k?"done":""}">${s}</div>`).join("")+`</div>`;
}
function slipBox(o){
 const img=o.slipImg||"",isUrl=/^https?:\/\//i.test(img),isData=/^data:image\//i.test(img);
 if(!isUrl&&!isData) return o.slip
  ? `<div class="slipbox"><b>สลิปโอนเงิน</b><div class="mute">แนบไว้: ${esc(o.slip)} — คำสั่งซื้อนี้บันทึกก่อนมีระบบเก็บรูป จึงเปิดดูรูปไม่ได้ (ให้ลูกค้าแนบใหม่ได้)</div></div>`
  : "";
 const link=isUrl?`<a class="btn" href="${esc(img)}" target="_blank" rel="noopener">เปิดสลิปขนาดเต็ม</a>`
  :`<a class="btn" href="${esc(img)}" download="slip-${o.id}.jpg">ดาวน์โหลดสลิป</a>`;
 return `<div class="slipbox"><b>สลิปโอนเงิน</b>
  <a href="${esc(img)}" ${isUrl?`target="_blank" rel="noopener"`:`download="slip-${o.id}.jpg"`}><img class="slip" src="${esc(img)}" alt="สลิปของคำสั่งซื้อ ${o.id}" loading="lazy"></a>
  <div class="row" style="margin-top:6px">${link}${o.slip?`<span class="mute">ไฟล์: ${esc(o.slip)}</span>`:""}</div></div>`;
}
function orderCard(o,admin){
 const user=DB.users.find(u=>u.id===o.userId);
 return `<div class="card" style="margin-bottom:12px"><div class="row"><b>คำสั่งซื้อ #${o.id}</b><span class="mute">${o.date}</span>${admin?`<span class="mute">· ${esc(user?.name)}</span>`:""}<span class="tag" style="margin-left:auto">${o.status}</span></div>
 ${timeline(o)}
 <ul>${o.items.map(i=>`<li>${esc(i.name)} × ${i.qty}<span class="mute"> ${esc(customText(i.custom))}</span></li>`).join("")}</ul>
 <div class="mute">ส่งที่: ${esc(o.address)}</div>
 <p>ยอดรวม <b>${baht(o.total)}</b> · สลิป: ${o.slipImg||o.slip?`<span class="tag ok">แนบแล้ว</span>`:`<span class="tag warn">ยังไม่แนบ</span>`}</p>
 ${slipBox(o)}
 ${o.tracking?`<p>ขนส่ง ${esc(o.carrier)} · เลขพัสดุ <b>${esc(o.tracking)}</b></p>`:""}
 ${admin?adminControls(o):customerPay(o)}</div>`;
}
function customerPay(o){
 if(o.status!=="รอชำระเงิน")return "";
 return `<div class="card" style="background:var(--soft)"><b>โอนเงินมาที่</b><div>ธนาคาร${esc(DB.bank.bank)} · ${esc(DB.bank.name)} · ${esc(DB.bank.no)}</div>
 <label>${o.slipImg?"แนบสลิปใหม่ (ทับของเดิม)":"แนบสลิปโอนเงิน"}</label><input type="file" accept="image/*" data-slip="${o.id}"><div class="mute">แนบแล้วรอแอดมินตรวจสอบ ลูกค้าไม่สามารถเปลี่ยนสถานะเองได้</div></div>`;
}
function vOrders(){
 if(!S.me)return `<div class="card"><b>เข้าสู่ระบบเพื่อดูคำสั่งซื้อ</b><p class="mute">สมาชิกเท่านั้นที่ดูคำสั่งซื้อของตัวเองได้</p><p><button class="pri" data-go="login">เข้าสู่ระบบ</button></p></div>`;
 const mine=DB.orders.filter(o=>o.userId===S.me.id).reverse();
 const unsent=mine.filter(o=>o.synced!==true).length;
 const bar=`<div class="card" style="margin-bottom:12px"><div class="row"><span class="mute">อัปเดตล่าสุด: ${typeof lastSync!=="undefined"&&lastSync?lastSync:"—"}</span>
  <button data-act="refresh" style="margin-left:auto">อัปเดตเดี๋ยวนี้</button></div>
  ${unsent?`<div class="mute" style="margin-top:6px">มี ${unsent} รายการที่ยังส่งขึ้นเซิร์ฟเวอร์ไม่สำเร็จ — ระบบจะลองใหม่ให้อัตโนมัติทุก 20 วินาที (เปิดหน้านี้ค้างไว้)</div>`:`<div class="mute" style="margin-top:6px">สถานะคำสั่งซื้อจะอัปเดตเองทุก ~20 วินาทีเมื่อแอดมินเปลี่ยนสถานะ</div>`}</div>`;
 return `<h2>คำสั่งซื้อของฉัน</h2>`+bar+(mine.length?mine.map(o=>orderCard(o,false)).join(""):`<p class="mute">ยังไม่มีคำสั่งซื้อ</p>`);
}
function vProfile(){
 const u=S.me;
 return `<h2>บัญชีของฉัน</h2><form id="f-profile" class="card" style="max-width:420px"><label>ชื่อ-นามสกุล</label><input name="name" value="${esc(u.name)}"><label>เบอร์โทรศัพท์</label><input name="phone" value="${esc(u.phone)}"><label>ที่อยู่</label><textarea name="address" rows="2">${esc(u.address)}</textarea><p><button class="pri">บันทึก</button></p></form>`;
}
