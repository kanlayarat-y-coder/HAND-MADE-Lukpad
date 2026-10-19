/* ---------- Router ---------- */
const VIEWS={login:vLogin,shop:vShop,detail:vDetail,cart:vCart,orders:vOrders,profile:vProfile,"a-orders":vAOrders,"a-products":vAProducts,"a-users":vAUsers,"a-sync":vASync};
const ADMIN_ONLY=["a-orders","a-products","a-users","a-sync"];
const BROWSE=["login","shop","detail"];   // หน้าที่คนยังไม่ได้ลงทะเบียนดูได้ (สินค้าอย่างเดียว ซื้อไม่ได้)
function render(){
 if(!S.me&&!BROWSE.includes(S.view))S.view="shop";
 else if(S.me&&S.me.role!=="admin"&&ADMIN_ONLY.includes(S.view))S.view="shop";
 else if(S.me&&S.me.role==="admin"&&!ADMIN_ONLY.includes(S.view))S.view="a-orders";
 nav();$("#app").innerHTML=VIEWS[S.view]();
}

/* ---------- Events ---------- */
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-go],[data-act]");if(!b)return;
 if(b.dataset.go){go(b.dataset.go,b.dataset.id?+b.dataset.id:null);return}
 const a=b.dataset.act;
 if(a==="logout"){S.me=null;S.cart=[];go("login")}
 if(a==="mode"){S.mode=S.mode==="login"?"register":"login";render()}
 if(a==="rm"){S.cart.splice(+b.dataset.i,1);render()}
 if(a==="delp"&&confirm("ลบสินค้านี้?")){DB.products=DB.products.filter(p=>p.id!==+b.dataset.id);save();render()}
 if(a==="clrpimg"){const v=$("#pimg-val"),pr=$("#pimg-prev");if(v)v.value="";if(pr)pr.innerHTML="📿"}
 if(a==="sheet-save"){setSheetUrl($("#sheet-url").value);toast(sheetUrl?"บันทึกลิงก์แล้ว":"ล้างลิงก์แล้ว")}
 if(a==="sheet-test")sheetTest();
 if(a==="sheet-push")sheetPush();
 if(a==="sheet-pull")sheetPull();
});
document.addEventListener("change",async e=>{
 const id=e.target.dataset?.slip;
 if(id){if(!e.target.files[0])return;const o=DB.orders.find(x=>x.id==id);o.slip=e.target.files[0].name;save();toast("แนบสลิปแล้ว รอแอดมินตรวจสอบ");return render()}
 if(e.target.dataset?.pimg){
  const f=e.target.files[0];if(!f)return;
  try{const data=await shrinkImage(f);const v=$("#pimg-val"),pr=$("#pimg-prev");if(v)v.value=data;if(pr)pr.innerHTML=`<img src="${data}" alt="">`}
  catch(err){toast("อัปโหลดรูปไม่ได้: "+err.message)}
 }
});
document.addEventListener("submit",e=>{
 e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));
 if(f.id==="f-auth"){
  if(S.mode==="register"){
   if(DB.users.some(u=>u.email===d.email))return toast("อีเมลนี้ถูกใช้แล้ว");
   const u={id:DB.nextUser++,name:d.name,email:d.email,password:d.password,phone:d.phone,address:d.address,role:"customer"};
   DB.users.push(u);save();S.me=u;usersPush();toast("สมัครสมาชิกแล้ว ยินดีต้อนรับ");go("shop");return;
  }
  const u=DB.users.find(x=>x.email===d.email&&x.password===d.password);
  if(!u)return toast("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  S.me=u;go(u.role==="admin"?"a-orders":"shop");
 }
 if(f.id==="f-add"){
  if(!S.me)return go("login");
  const p=DB.products.find(x=>x.id==d.pid);
  const custom=p.custom?{สี:d["สี"],ขนาด:d["ขนาด"],ลาย:d["ลาย"],ตัวอักษร:d["ตัวอักษร"]}:null;
  S.cart.push({pid:p.id,name:p.name,price:p.price,ship:p.ship,qty:Math.max(1,+d.qty||1),custom});
  toast("เพิ่มลงตะกร้าแล้ว");go("cart");
 }
 if(f.id==="f-checkout"){
  if(!S.me)return go("login");
  const t=totals(S.cart);
  DB.orders.push({id:DB.nextOrder++,userId:S.me.id,date:new Date().toISOString().slice(0,10),items:S.cart,address:d.address,total:t.total,status:"รอชำระเงิน",slip:"",carrier:"",tracking:""});
  S.cart=[];save();toast("สั่งซื้อแล้ว กรุณาโอนเงินและแนบสลิป");go("orders");
 }
 if(f.id==="f-profile"){if(!S.me)return go("login");Object.assign(S.me,d);save();usersPush();toast("บันทึกแล้ว")}
 if(f.id==="f-prod"){
  if(S.me?.role!=="admin")return toast("ต้องเข้าสู่ระบบด้วยสิทธิ์แอดมิน");
  const item={name:d.name,category:d.category,icon:d.icon||"📿",img:d.img||"",price:+d.price,ship:+d.ship,size:d.size,desc:d.desc,custom:!!d.custom};
  if(S.sel)Object.assign(DB.products.find(x=>x.id===S.sel),item);else DB.products.push({id:DB.nextProduct++,...item});
  save();toast("บันทึกสินค้าแล้ว");go("a-products");
 }
 if(f.dataset.ord){
  if(S.me?.role!=="admin")return;
  const o=DB.orders.find(x=>x.id==f.dataset.ord);
  if(d.status==="จัดส่งแล้ว"&&!d.tracking)return toast("กรุณาใส่เลขพัสดุก่อนเปลี่ยนเป็นจัดส่งแล้ว");
  Object.assign(o,{status:d.status,carrier:d.carrier,tracking:d.tracking});save();toast("อัปเดตสถานะแล้ว");render();
 }
});
render();
autoPull();   // ถ้าตั้งค่า SHEET_URL ไว้ จะดึงข้อมูลล่าสุดจากชีตให้ลูกค้าอัตโนมัติเมื่อเปิดเว็บ
