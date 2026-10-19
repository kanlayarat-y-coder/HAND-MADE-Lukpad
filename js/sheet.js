/* ---------- Google Sheet sync (เรียกผ่าน Apps Script Web App) ---------- */
const SHEET_KEY="lukpad_sheet_url";
let sheetUrl=localStorage.getItem(SHEET_KEY)??SHEET_URL;   // ค่าจากหน้า "ซิงก์ชีต" เฉพาะเครื่องมีสิทธิ์ทับค่าใน config.js
const setSheetUrl=u=>{sheetUrl=(u||"").trim();
 if(sheetUrl)localStorage.setItem(SHEET_KEY,sheetUrl);else{localStorage.removeItem(SHEET_KEY);sheetUrl=SHEET_URL}};
async function sheetGet(){
 if(!sheetUrl)throw new Error("ยังไม่ได้ตั้งค่า Web App URL");
 const r=await fetch(sheetUrl+(sheetUrl.includes("?")?"&":"?")+"action=list");
 return sheetParse(await r.text());
}
async function sheetPost(payload){
 if(!sheetUrl)throw new Error("ยังไม่ได้ตั้งค่า Web App URL");
 const body=JSON.stringify(payload);
 let r;
 try{
  r=await fetch(sheetUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body});
 }catch(err){ // CORS ถูกบล็อก → ส่งแบบ no-cors (ได้ผล แต่ไม่อ่านคำตอบ)
  await fetch(sheetUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body});
  return {ok:true,sentOnly:true};
 }
 return sheetParse(await r.text());
}
function sheetParse(t){
 let j;try{j=JSON.parse(t)}catch(e){throw new Error("ตอบกลับไม่ถูกต้อง — ตรวจว่า Deploy เป็น Web app (Execute as: Me, Access: Anyone) แล้วหรือยัง")}
 if(!j||j.ok!==true)throw new Error(j&&j.error?j.error:"เชื่อมต่อไม่สำเร็จ");
 return j;
}

/* ---------- แปลงข้อมูลแอป ↔ ชีต ---------- */
function sheetPayload(){
 return {action:"push",
  users:DB.users.map(u=>({id:u.id,name:u.name,email:u.email,password:u.password||"",phone:u.phone||"",address:u.address||"",role:u.role})),
  products:DB.products.map(p=>({id:p.id,name:p.name,category:p.category||"",img:p.img||"",price:p.price,ship:p.ship??59,size:p.size||"",desc:p.desc||"",custom:p.custom?1:0})),
  orders:DB.orders.map(o=>({id:o.id,userId:o.userId,date:o.date,total:o.total,status:o.status,address:o.address||"",slip:o.slip||"",carrier:o.carrier||"",tracking:o.tracking||"",
   items:o.items.map(i=>({pid:i.pid,name:i.name,qty:i.qty,price:i.price,ship:i.ship||0,custom:customText(i.custom)}))}))};
}
/* ส่งเฉพาะสมาชิกขึ้นชีต — ใช้ทันทีที่มีคนสมัครใหม่ (ไม่แตะสินค้า/คำสั่งซื้อ) */
async function usersPush(){if(!sheetUrl)return;try{await sheetPost({action:"users",users:DB.users.map(u=>({id:u.id,name:u.name,email:u.email,password:u.password||"",phone:u.phone||"",address:u.address||"",role:u.role}))})}catch(e){}}
const num=(v,d=0)=>{const n=parseFloat(v);return isNaN(n)?d:n};
function parseCustom(t){const c={};String(t||"").split(",").forEach(kv=>{const i=kv.indexOf(":");if(i>0)c[kv.slice(0,i).trim()]=kv.slice(i+1).trim()});return Object.keys(c).length?c:null}

function sheetApplyUsers(list){ // ชีต → แอป (เฉพาะสมาชิก: รวมตาม id หรืออีเมล)
 (list||[]).forEach(su=>{
  const id=num(su.user_id||su.id);
  const data={name:su.user_name||su.name||"",email:su.email||"",phone:su.phone||"",address:su.address||"",role:String(su.role||su.user_role||"customer").toLowerCase()==="admin"?"admin":"customer"};
  if(!data.email&&!data.name)return;
  const u=(id&&DB.users.find(x=>x.id==id))||DB.users.find(x=>x.email&&data.email&&x.email.toLowerCase()===data.email.toLowerCase());
  if(u)Object.assign(u,data,{password:su.password||u.password});
  else DB.users.push({id:id||DB.nextUser++,password:su.password||"",...data});
 });
 DB.nextUser=Math.max(DB.nextUser||1003,...DB.users.map(u=>(+u.id||1000)+1));
}

function sheetApply(d){ // ชีต → แอป
 sheetApplyUsers(d.users);
 const old=DB.products.slice();
 DB.products=(d.products||[]).map(p=>{
  const o=old.find(x=>x.id==p.product_id);
  return {id:num(p.product_id),name:p.product_name||"",category:p.category||"",icon:o?.icon||"📿",img:String(p.product_image||"").trim()||(o?o.img:""),
   price:num(p.price),ship:num(p.shipping_fee,59),size:p.size||"",desc:p.description||"",custom:["1","true","ได้"].includes(String(p.is_customizable).toLowerCase())||p.is_customizable==="TRUE"};
 });
 DB.orders=(d.orders||[]).map(o=>({id:num(o.order_id),userId:num(o.user_id),date:o.order_date||"",total:num(o.total_amount),
  status:o.order_status||"รอชำระเงิน",address:o.ship_address||"",slip:o.slip_image||"",carrier:o.carrier||"",tracking:o.tracking_number||"",
  items:(d.details||[]).filter(x=>x.order_id==o.order_id).map(x=>({pid:num(x.product_id),name:x.product_name||"",qty:num(x.quantity,1),price:num(x.unit_price),ship:0,custom:parseCustom(x.custom_note)}))}));
 DB.nextProduct=Math.max(2005,...DB.products.map(p=>p.id))+1;
 DB.nextOrder=Math.max(3000,...DB.orders.map(o=>o.id))+1;
 if(S.me){const me=DB.users.find(u=>u.id===S.me.id);if(me)S.me=me}   // สมาชิกที่ล็อกอินอยู่ให้ใช้ข้อมูลล่าสุด
 save();
}
function sheetTakeImages(d){ // รับลิงก์รูปที่ Apps Script อัปเข้า Drive แล้วแทน base64 เดิม
 if(!d.images)return 0;let n=0;
 d.images.forEach(x=>{const p=DB.products.find(p=>p.id==x.id);if(p&&x.img&&p.img!==x.img){p.img=x.img;n++}});
 if(n)save();return n;
}

/* ---------- ปุ่มในหน้า a-sync ---------- */
async function sheetTest(){
 try{const j=await sheetGet();toast("เชื่อมต่อสำเร็จ · สมาชิก "+(j.users||[]).length+" · สินค้า "+(j.products||[]).length+" · คำสั่งซื้อ "+(j.orders||[]).length)}
 catch(err){toast("เชื่อมต่อไม่ได้: "+err.message)}
}
async function sheetPush(){
 if(!confirm("อัปโหลดข้อมูลในแอปขึ้นชีต?\n(สมาชิก สินค้า และคำสั่งซื้อในแท็บ USERS / PRODUCTS / ORDERS / ORDER_DETAILS / PAYMENTS / SHIPMENTS จะถูกแทนที่)"))return;
 toast("กำลังอัปโหลด...");
 try{
  const j=await sheetPost(sheetPayload());
  if(j.sentOnly){toast("ส่งข้อมูลแล้ว (ไม่อ่านคำตอบ) กด “ดึงข้อมูลจากชีต” เพื่อตรวจสอบ")}
  else{const n=sheetTakeImages(j);toast("อัปโหลดขึ้นชีตแล้ว · สมาชิก "+(j.users||0)+" · สินค้า "+(j.products||0)+" · คำสั่งซื้อ "+(j.orders||0)+(n?" · รูปเข้า Drive "+n+" รูป":""))}
  render();
 }catch(err){toast("อัปโหลดไม่สำเร็จ: "+err.message)}
}
async function sheetPull(){
 if(!confirm("ดึงข้อมูลจากชีตมาทับข้อมูลในแอป?\n(สมาชิก สินค้า และคำสั่งซื้อในเครื่องจะถูกแทนที่/รวมกับข้อมูลจากชีต)"))return;
 toast("กำลังดึงข้อมูล...");
 try{
  const j=await sheetGet();sheetApply(j);
  toast("ดึงข้อมูลจากชีตแล้ว · สมาชิก "+DB.users.length+" · สินค้า "+DB.products.length+" · คำสั่งซื้อ "+DB.orders.length);render();
 }catch(err){toast("ดึงข้อมูลไม่สำเร็จ: "+err.message)}
}

/* ---------- ดึงอัตโนมัติเมื่อเปิดเว็บ (ให้ลูกค้า/ผู้เยี่ยมชมเห็นข้อมูลจริงจากชีต) ---------- */
let autoPulled=false;
async function autoPull(){
 if(autoPulled||!sheetUrl)return;
 autoPulled=true;
 if(S.me&&S.me.role==="admin")return;   // แอดมินกดปุ่มเอง กันข้อมูลที่ยังไม่ได้ push หาย
 try{
  const j=await sheetGet();
  if(!(j.products||[]).length&&!(j.orders||[]).length)return;   // ชีตยังว่าง ไม่ทับข้อมูลในเครื่อง
  sheetApply(j);render();
 }catch(e){}   // เน็ต/สิทธิ์มีปัญหา ก็ใช้ข้อมูลในเครื่องต่อไป
}
