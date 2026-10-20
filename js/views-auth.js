function nav(){
 const n=$("#nav");
 if(!S.me){ // ผู้เยี่ยมชม: ดูสินค้าได้ แต่ต้องเข้าสู่ระบบก่อนจึงจะซื้อได้
  n.innerHTML=`<button class="${S.view==="login"?"on":""}" data-go="login">เข้าสู่ระบบ / สมัครสมาชิก</button>`
   +`<button class="${S.view==="shop"||S.view==="detail"?"on":""}" data-go="shop">ดูสินค้า</button>`;
  return;
 }
 const items=S.me.role==="admin"
  ?[["a-orders","จัดการคำสั่งซื้อ"],["a-products","จัดการสินค้า"],["a-users","สมาชิก"],["a-sync","ซิงก์ชีต"]]
  :[["shop","สินค้า"],["cart","ตะกร้า ("+S.cart.length+")"],["orders","คำสั่งซื้อ"],["profile","บัญชี"]];
 n.innerHTML=items.map(([v,l])=>`<button class="${S.view===v?"on":""}" data-go="${v}">${l}</button>`).join("")+`<button data-act="logout">ออกจากระบบ</button>`;
}

/* ---------- Auth ---------- */
function vLogin(){
 const reg=S.mode==="register";
 return `<div class="card box"><h2>${reg?"สมัครสมาชิก":"เข้าสู่ระบบ"}</h2>
 <form id="f-auth">
 ${reg?`<label>ชื่อ-นามสกุล</label><input name="name" required><label>เบอร์โทรศัพท์</label><input name="phone" required><label>ที่อยู่จัดส่ง</label><textarea name="address" rows="2" required></textarea>`:""}
 <label>อีเมล</label><input name="email" type="email" required>
 <label>รหัสผ่าน</label><input name="password" type="password" required>
 <p><button class="pri" style="width:100%">${reg?"สมัครสมาชิก":"เข้าสู่ระบบ"}</button></p></form>
 <p style="text-align:center"><button data-act="mode">${reg?"มีบัญชีแล้ว? เข้าสู่ระบบ":"ยังไม่มีบัญชี? สมัครสมาชิก"}</button></p>
 <p style="text-align:center"><button data-go="shop">ดูสินค้าก่อน (ไม่ต้องเข้าสู่ระบบ)</button></p>
 <p class="mute">ดูรายละเอียดสินค้าได้เลย แต่การสั่งซื้อต้องเข้าสู่ระบบ/สมัครสมาชิกก่อน</p></div>`;
}
