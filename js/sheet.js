/* ---------- Google Sheet sync (เรียกผ่าน Apps Script Web App) ---------- */
const SHEET_KEY="lukpad_sheet_url";
let sheetUrl=localStorage.getItem(SHEET_KEY)??SHEET_URL;   // ค่าจากหน้า "ซิงก์ชีต" เฉพาะเครื่องมีสิทธิ์ทับค่าใน config.js
const setSheetUrl=u=>{sheetUrl=(u||"").trim();
 if(sheetUrl)localStorage.setItem(SHEET_KEY,sheetUrl);else{localStorage.removeItem(SHEET_KEY);sheetUrl=SHEET_URL}};
let sheetVersion=0;   // เวอร์ชันของสคริปต์ฝั่งชีต (1 = เก่า ไม่รองรับ action "order")
async function sheetGet(){
 if(!sheetUrl)throw new Error("ยังไม่ได้ตั้งค่า Web App URL");
 const r=await fetch(sheetUrl+(sheetUrl.includes("?")?"&":"?")+"action=list");
 const j=sheetParse(await r.text());
 sheetVersion=j.version||1;
 return j;
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
  orders:DB.orders.map(o=>({id:o.id,userId:o.userId,date:o.date,total:o.total,status:o.status,address:o.address||"",slip:o.slip||"",slipImg:o.slipImg||"",carrier:o.carrier||"",tracking:o.tracking||"",
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
 const oldO=DB.orders.slice();
 DB.orders=(d.orders||[]).map(o=>{
  const prev=oldO.find(x=>x.id==o.order_id);
  const url=/^(https?:\/\/|data:image\/)/i.test(o.slip_image||"")?String(o.slip_image).trim():"";
  /* ถ้าชีตมีแค่ “ชื่อไฟล์” แต่ในเครื่องนี้ยังมีรูปสลิป (base64) → เก็บรูปไว้และตั้งเป็น “ยังไม่ซิงก์”
     เพื่อให้ระบบส่งรูปขึ้น Drive อีกครั้งโดยที่ลูกค้าไม่ต้องแนบใหม่ (ทำงานเมื่อสคริปต์เวอร์ชันใหม่ถูก deploy) */
  const hasSheet=/^https?:\/\//i.test(url);
  const local=/^data:image\//i.test(prev?prev.slipImg||"":"")?prev.slipImg:"";
  const reupload=!hasSheet&&!!local;
  return {id:num(o.order_id),userId:num(o.user_id),date:o.order_date||"",total:num(o.total_amount),
   status:o.order_status||"รอชำระเงิน",address:o.ship_address||"",
   slip:o.slip_name||(url?"":(o.slip_image||""))||(prev?prev.slip:""),
   slipImg:hasSheet?url:(local||(prev?prev.slipImg||"":"")),
   carrier:o.carrier||"",tracking:o.tracking_number||"",synced:!reupload,pending:reupload,
   items:(d.details||[]).filter(x=>x.order_id==o.order_id).map(x=>({pid:num(x.product_id),name:x.product_name||"",qty:num(x.quantity,1),price:num(x.unit_price),ship:0,custom:parseCustom(x.custom_note)}))};
 });
 /* ออเดอร์ที่ยังส่งขึ้นชีตไม่สำเร็จ — เก็บไว้ในเครื่อง ห้ามลบทิ้ง (จะลองส่งใหม่ในรอบถัดไป) */
 const keep=oldO.filter(o=>o.synced!==true&&!DB.orders.some(n=>n.id==o.id));
 if(keep.length)DB.orders=DB.orders.concat(keep);
 DB.nextProduct=Math.max(2005,...DB.products.map(p=>p.id))+1;
 DB.nextOrder=Math.max(3000,...DB.orders.map(o=>o.id))+1;
 if(S.me){const me=DB.users.find(u=>u.id===S.me.id);if(me)S.me=me}   // สมาชิกที่ล็อกอินอยู่ให้ใช้ข้อมูลล่าสุด
 save();
}
function sheetTakeImages(d){ // รับลิงก์รูปที่ Apps Script อัปเข้า Drive แล้วแทน base64 เดิม (ลดพื้นที่ localStorage)
 let n=0;
 (d.images||[]).forEach(x=>{const p=DB.products.find(p=>p.id==x.id);if(p&&x.img&&p.img!==x.img){p.img=x.img;n++}});
 (d.slips||[]).forEach(x=>{const o=DB.orders.find(o=>o.id==x.id);if(o&&x.img&&o.slipImg!==x.img){o.slipImg=x.img;n++}});
 if(n)save();return n;
}

/* ---------- ส่ง/อัปเดต “ออเดอร์เดียว” ขึ้นชีตทันที (ลูกค้าสั่งซื้อ · แนบสลิป · แอดมินเปลี่ยนสถานะ) ---------- */
function orderPayload(o){return {id:o.id,userId:o.userId,date:o.date,total:o.total,status:o.status,address:o.address||"",
 slip:o.slip||"",slipImg:o.slipImg||"",carrier:o.carrier||"",tracking:o.tracking||"",
 items:(o.items||[]).map(i=>({pid:i.pid,name:i.name,qty:i.qty,price:i.price,ship:i.ship||0,custom:customText(i.custom)}))}}
async function orderPush(o){   // ไม่ throw — คืน true/false เพื่อให้ UI แจ้งเตือนได้
 if(!sheetUrl||!o)return false;
 try{
  const j=await sheetPost({action:"order",order:orderPayload(o)});
  if(!j.sentOnly)sheetTakeImages(j);
  o.synced=true;o.pending=false;save();return true;
 }catch(e){o.pending=true;save();return false}
}
async function orderPushAll(){   // ลองส่งออเดอร์ที่ค้างอยู่ใหม่
 const list=DB.orders.filter(o=>o.synced!==true);
 let n=0;for(const o of list){if(await orderPush(o))n++}
 return {tried:list.length,ok:n};
}

/* ---------- อัปเดตอัตโนมัติ (ใกล้เรียลไทม์) ---------- */
const POLL_MS=20000;
let pollTimer=null,lastSync="";
const POLL_VIEWS=["a-orders","a-users","orders"];   // a-products ไม่ poll กันฟอร์มสินค้าถูกแทนที่ขณะพิมพ์
const shouldPoll=()=>!!sheetUrl&&S.auto!==false&&(POLL_VIEWS.includes(S.view)||DB.orders.some(o=>o.synced!==true));
function isTyping(){const a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))}
async function pullQuiet(force){   // ดึงข้อมูลใหม่แบบเงียบ ๆ แล้ววาดหน้าจอใหม่
 if(!sheetUrl)return false;
 if(isTyping()&&!force)return false;   // อย่าดึงทับตอนกำลังพิมพ์ฟอร์ม
 try{
  const before={};DB.orders.forEach(o=>before[o.id]={slip:o.slipImg||o.slip,status:o.status});
  const j=await sheetGet();sheetApply(j);
  lastSync=new Date().toLocaleTimeString("th-TH",{hour12:false});
  render();
  const fresh=DB.orders.filter(o=>!before[o.id]).map(o=>o.id);
  const newSlip=DB.orders.filter(o=>before[o.id]&&(o.slipImg||o.slip)!==before[o.id].slip).map(o=>o.id);
  const upgraded=DB.orders.filter(o=>before[o.id]&&o.status!==before[o.id].status).map(o=>o.id);
  if(fresh.length)toast("มีคำสั่งซื้อใหม่ #"+fresh.join(" #"));
  else if(newSlip.length)toast("มีสลิปใหม่จากคำสั่งซื้อ #"+newSlip.join(" #"));
  else if(upgraded.length)toast("สถานะเปลี่ยน: #"+upgraded.join(" #")+" → "+(DB.orders.find(o=>o.id===upgraded[0])||{}).status);
  return true;
 }catch(e){return false}
}
async function syncTick(){   // หนึ่งรอบของตัวจับเวลา: ส่งของค้างก่อน แล้วค่อยดึงของใหม่
 if(!sheetUrl||document.hidden||isTyping())return;
 if(DB.orders.some(o=>o.synced!==true)){   // มีของค้าง → ส่งขึ้นชีตก่อน (ทำได้ทุกหน้า ไม่ต้องวาดหน้า)
  const r=await orderPushAll();
  if(r.ok&&POLL_VIEWS.includes(S.view))render();
  return;
 }
 if(!POLL_VIEWS.includes(S.view))return;   // นอกหน้าที่ตั้งไว้ ไม่ต้องดึง (กันข้อมูลฟอร์มถูกแทนที่)
 await pullQuiet();
}
function startPoll(){if(pollTimer||!shouldPoll())return;pollTimer=setInterval(syncTick,POLL_MS)}
function stopPoll(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}}
const syncPoll=()=>{shouldPoll()?startPoll():stopPoll()};

/* ---------- ปุ่มในหน้า a-sync ---------- */
async function sheetTest(){
 try{
  const j=await sheetGet();render();
  toast("เชื่อมต่อสำเร็จ · สมาชิก "+(j.users||[]).length+" · สินค้า "+(j.products||[]).length+" · คำสั่งซื้อ "+(j.orders||[]).length);
  if(sheetVersion<2)setTimeout(()=>toast("สคริปต์ในชีตเป็นเวอร์ชันเก่า — กดส่งออเดอร์ทีละใบไม่ได้ ให้วาง gs/Code.gs ใหม่แล้ว Deploy ใหม่"),2400);
 }catch(err){toast("เชื่อมต่อไม่ได้: "+err.message)}
}
async function sheetPush(){
 if(!confirm("อัปโหลดข้อมูลในแอปขึ้นชีต?\n(สมาชิก สินค้า และคำสั่งซื้อในแท็บ USERS / PRODUCTS / ORDERS / ORDER_DETAILS / PAYMENTS / SHIPMENTS จะถูกแทนที่)"))return;
 toast("กำลังอัปโหลด...");
 try{
  const j=await sheetPost(sheetPayload());
  DB.orders.forEach(o=>{o.synced=true;o.pending=false});
  if(j.sentOnly){toast("ส่งข้อมูลแล้ว (ไม่อ่านคำตอบ) กด “ดึงข้อมูลจากชีต” เพื่อตรวจสอบ")}
  else{const n=sheetTakeImages(j);toast("อัปโหลดขึ้นชีตแล้ว · สมาชิก "+(j.users||0)+" · สินค้า "+(j.products||0)+" · คำสั่งซื้อ "+(j.orders||0)+(n?" · รูป/สลิปเข้า Drive "+n+" ไฟล์":""))}
  lastSync=new Date().toLocaleTimeString("th-TH",{hour12:false});
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
 if(S.me&&S.me.role==="admin"){syncPoll();return}   // แอดมินใช้ตัวจับเวลาดึงข้อมูลเอง (กันข้อมูลที่ยังไม่ได้ push หาย)
 try{
  const j=await sheetGet();
  if((j.products||[]).length||(j.orders||[]).length){sheetApply(j);render()}   // ชีตยังว่าง ไม่ทับข้อมูลในเครื่อง
  const r=await orderPushAll();   // ส่งออเดอร์ที่ค้างในเครื่องขึ้นชีต
  if(r.ok)render();
  syncPoll();
 }catch(e){syncPoll()}   // เน็ต/สิทธิ์มีปัญหา ก็ใช้ข้อมูลในเครื่องต่อไป
}
