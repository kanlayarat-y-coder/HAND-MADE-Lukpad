/* ---------- Router ---------- */
const VIEWS={login:vLogin,shop:vShop,detail:vDetail,cart:vCart,checkout:vCheckout,orders:vOrders,profile:vProfile,"a-orders":vAOrders,"a-products":vAProducts,"a-users":vAUsers,"a-sync":vASync};
const ADMIN_ONLY=["a-orders","a-products","a-users","a-sync"];
const BROWSE=["login","shop","detail"];   // หน้าที่คนยังไม่ได้ลงทะเบียนดูได้ (สินค้าอย่างเดียว ซื้อไม่ได้)
function render(){
 if(!S.me&&!BROWSE.includes(S.view))S.view="shop";
 else if(S.me&&S.me.role!=="admin"&&ADMIN_ONLY.includes(S.view))S.view="shop";
 else if(S.me&&S.me.role==="admin"&&!ADMIN_ONLY.includes(S.view))S.view="a-orders";
 nav();$("#app").innerHTML=VIEWS[S.view]();
 if(typeof syncPoll==="function")syncPoll();   // เปิด/ปิดการดึงข้อมูลอัตโนมัติตามหน้าปัจจุบัน
}

/* ---------- Events ---------- */
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-go],[data-act]");if(!b)return;
 if(b.dataset.go){go(b.dataset.go,b.dataset.id?+b.dataset.id:null);return}
 const a=b.dataset.act;
 if(a==="logout"){S.me=null;S.cart=[];saveSession(null);go("login")}
 if(a==="mode"){S.mode=S.mode==="login"?"register":"login";render()}
 if(a==="rm"){S.cart.splice(+b.dataset.i,1);render()}
 if(a==="delp"&&confirm("ลบสินค้านี้?")){DB.products=DB.products.filter(p=>p.id!==+b.dataset.id);save();render()}
 if(a==="clrpimg"){const v=$("#pimg-val"),pr=$("#pimg-prev");if(v)v.value="";if(pr)pr.innerHTML="📿"}
 if(a==="sliponly"){S.slipOnly=!S.slipOnly;render()}
 if(a==="ck-step"){S.payName="";S.step=Math.min(3,Math.max(1,+b.dataset.step||1));render();return}
 if(a==="auto"){S.auto=S.auto===false;syncPoll();render();toast(S.auto?"เปิดอัปเดตอัตโนมัติ (ทุก 20 วินาที)":"ปิดอัปเดตอัตโนมัติ — กด “อัปเดตเดี๋ยวนี้” เอง")}
 if(a==="refresh"){toast("กำลังดึงข้อมูลล่าสุด...");pullQuiet(true).then(ok=>toast(ok?"อัปเดตล่าสุด "+lastSync:"ดึงข้อมูลไม่ได้ — ตรวจการเชื่อมต่อ/ลิงก์ชีต"))}
 if(a==="sheet-save"){setSheetUrl($("#sheet-url").value);toast(sheetUrl?"บันทึกลิงก์แล้ว":"ล้างลิงก์แล้ว")}
 if(a==="sheet-test")sheetTest();
 if(a==="sheet-push")sheetPush();
 if(a==="sheet-pull")sheetPull();
});
document.addEventListener("change",async e=>{
 if(e.target.id==="ck-slip"){   // เลือกไฟล์สลิปในขั้นตอนชำระเงิน — โชว์ชื่อไฟล์ (ย่อรูปจริงตอนกดยืนยัน)
  const fl=e.target.files&&e.target.files[0];
  S.payName=fl?fl.name:"";
  const nm=$("#ck-slip-name");if(nm)nm.textContent=S.payName;
  return;
 }
 const id=e.target.dataset?.slip;
 if(id){
  const f=e.target.files[0];if(!f)return;
  const o=DB.orders.find(x=>x.id==id);if(!o)return;
  if(!S.me)return go("login");
  if(o.userId!==S.me.id&&S.me.role!=="admin")return toast("แนบสลิปได้เฉพาะคำสั่งซื้อของตัวเอง");
  if(o.status!=="รอชำระเงิน"&&S.me.role!=="admin")return toast("คำสั่งซื้อนี้ปิดรับการแนบสลิปแล้ว (สถานะ: "+o.status+")");
  try{const data=await shrinkImage(f,1400,.85);o.slip=f.name;o.slipImg=data;o.synced=false;save();toast("แนบสลิปแล้ว กำลังส่งให้แอดมิน...");
   orderPush(o).then(ok=>{toast(ok?"ส่งสลิปให้แอดมินแล้ว":"ยังส่งขึ้นชีตไม่ได้ — ระบบจะลองใหม่เองทุก 20 วินาที");render()});}
  catch(err){toast("อ่านไฟล์สลิปไม่ได้: "+err.message)}
  return render();
 }
 if(e.target.dataset?.pimg){
  const f=e.target.files[0];if(!f)return;
  try{const data=await shrinkImage(f);const v=$("#pimg-val"),pr=$("#pimg-prev");if(v)v.value=data;if(pr)pr.innerHTML=`<img src="${data}" alt="">`}
  catch(err){toast("อัปโหลดรูปไม่ได้: "+err.message)}
 }
});
document.addEventListener("input",e=>{   // ช่องตัวอักษร (A–Z, ก–ฮ) — เหลือตัวอักษรอังกฤษ/ไทย ตัวเดียว
 const t=e.target;if(t.name!=="ตัวอักษร"&&!/_text$/.test(t.name||""))return;
 const v=(t.value||"").replace(/[^A-Za-z\u0E01-\u0E3A]/g,"").slice(0,1);
 if(v!==t.value)t.value=v;
});
document.addEventListener("submit",async e=>{
 e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));
 if(f.id==="f-auth"){
  if(S.mode==="register"){
   if(DB.users.some(u=>u.email===d.email))return toast("อีเมลนี้ถูกใช้แล้ว");
   const u={id:DB.nextUser++,name:d.name,email:d.email,password:d.password,phone:d.phone,address:d.address,role:"customer"};
   DB.users.push(u);save();S.me=u;saveSession(u);usersPush();toast("สมัครสมาชิกแล้ว ยินดีต้อนรับ");go("shop");return;
  }
  const u=DB.users.find(x=>x.email===d.email&&x.password===d.password);
  if(!u)return toast("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  S.me=u;saveSession(u);go(u.role==="admin"?"a-orders":"shop");
 }
 if(f.id==="f-add"){
  if(!S.me)return go("login");
  const p=DB.products.find(x=>x.id==d.pid);
  const custom=canCustom(p)?{สี:d["สี"],ขนาด:d["ขนาด"],ลาย:d["ลาย"],ตัวอักษร:d["ตัวอักษร"]}:null;
  S.cart.push({pid:p.id,name:p.name,price:p.price,ship:p.ship,qty:Math.max(1,+d.qty||1),custom});
  toast("เพิ่มลงตะกร้าแล้ว");go("cart");
 }
 if(f.id==="f-cust"){   // ขั้นตอนที่ 1 — เก็บตัวเลือกสี/ขนาด/ลาย/ข้อความ ลงในตะกร้า
 if(!S.me)return go("login");
 S.cart.forEach((i,x)=>{
  if(!ckCustom(i))return;   // สินค้าที่ปิดการปรับแต่ง — ไม่แตะค่าเดิม
  const g=k=>(d[k]||"").trim();
  const col=g(`i${x}_color`),sz=g(`i${x}_size`),pat=g(`i${x}_pattern`),txt=g(`i${x}_text`);
  i.custom=(col||sz||pat||txt)?{สี:col,ขนาด:sz,ลาย:pat,ตัวอักษร:txt}:null;
 });
 S.step=2;render();return;
}
if(f.id==="f-addr"){   // ขั้นตอนที่ 2 — ที่อยู่จัดส่ง (บันทึกไว้ในบัญชีด้วย)
 if(!S.me)return go("login");
 S.addr=(d.address||"").trim();
 if(d.name)S.me.name=d.name.trim();
 if(d.phone)S.me.phone=d.phone.trim();
 S.me.address=S.addr;
 save();
 S.step=3;render();return;
}
if(f.id==="f-pay"){   // ขั้นตอนที่ 3 — ยืนยันและสร้างออเดอร์ (ยอดรวมรวมค่าจัดส่งแล้ว)
 if(!S.me)return go("login");
 const t=totals(S.cart);
 let slip="",slipImg="";
 const fi=f.querySelector("#ck-slip"),file=fi&&fi.files&&fi.files[0];
 if(file){try{slipImg=await shrinkImage(file,1400,.85);slip=file.name}
  catch(err){toast("อ่านไฟล์สลิปไม่ได้: "+err.message)}}
 const o={id:DB.nextOrder++,userId:S.me.id,date:new Date().toISOString().slice(0,10),
  items:S.cart.map(i=>({...i,custom:i.custom?{...i.custom}:null})),
  address:S.addr||S.me.address||"",total:t.total,status:"รอชำระเงิน",
  slip,slipImg,carrier:"",tracking:"",synced:false,pending:true};
 DB.orders.push(o);
 S.cart=[];S.step=1;S.addr="";S.payName="";save();
 toast("สั่งซื้อแล้ว กรุณาโอนเงินและแนบสลิป");go("orders");
 orderPush(o).then(ok=>{toast(ok?"ส่งคำสั่งซื้อให้แอดมินแล้ว":"ยังส่งขึ้นชีตไม่ได้ — ระบบจะลองใหม่เองทุก 20 วินาที");if(S.view==="orders")render()});
 return;
}
 if(f.id==="f-profile"){if(!S.me)return go("login");Object.assign(S.me,d);save();usersPush();toast("บันทึกแล้ว")}
 if(f.id==="f-prod"){
  if(S.me?.role!=="admin")return toast("ต้องเข้าสู่ระบบด้วยสิทธิ์แอดมิน");
  const item={name:d.name,category:d.category,icon:d.icon||"📿",img:d.img||"",price:+d.price,ship:+d.ship,size:d.size,desc:d.desc,noCustom:!!d.noCustom,custom:!d.noCustom};
  if(S.sel)Object.assign(DB.products.find(x=>x.id===S.sel),item);else DB.products.push({id:DB.nextProduct++,...item});
  save();toast("บันทึกสินค้าแล้ว");go("a-products");
 }
 if(f.dataset.ord){
  if(S.me?.role!=="admin")return;
  const o=DB.orders.find(x=>x.id==f.dataset.ord);
  if(d.status==="จัดส่งแล้ว"&&!d.tracking)return toast("กรุณาใส่เลขพัสดุก่อนเปลี่ยนเป็นจัดส่งแล้ว");
  Object.assign(o,{status:d.status,carrier:d.carrier,tracking:d.tracking});save();toast("อัปเดตสถานะแล้ว (กำลังส่งขึ้นชีต)");render();
  orderPush(o).then(ok=>{if(!ok)toast("ส่งขึ้นชีตไม่สำเร็จ — ระบบจะลองใหม่เองทุก 20 วินาที")});
 }
});
if(S.me&&S.view==="login")S.view=S.me.role==="admin"?"a-orders":"shop";   // กู้เซสชันแล้วเข้าเมนูตามสิทธิ์ทันที
render();
autoPull();   // ถ้าตั้งค่า SHEET_URL ไว้ จะดึงข้อมูลล่าสุดจากชีตให้ลูกค้าอัตโนมัติเมื่อเปิดเว็บ

/* กลับมาที่แท็บ/หน้าต่างอีกครั้ง → อัปเดตทันที (ไม่ต้องรอรอบถัดไป) */
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&sheetUrl&&S.auto!==false&&shouldPoll())syncTick()});
window.addEventListener("focus",()=>{if(sheetUrl&&S.auto!==false&&shouldPoll())syncTick()});
