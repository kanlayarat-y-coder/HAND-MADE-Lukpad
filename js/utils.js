const S={me:null,view:"login",cart:[],sel:null,mode:"login",slipOnly:false,auto:true,
  step:1,        // ขั้นตอนของหน้าสั่งซื้อ (1 ปรับแต่ง · 2 จัดส่ง · 3 ชำระเงิน)
  addr:"",       // ที่อยู่จัดส่งของออเดอร์ที่กำลังสั่ง
  payName:""};   // ชื่อไฟล์สลิปที่เลือกไว้ในขั้นตอนชำระเงิน
/* กู้ “ผู้ใช้ที่ล็อกอินอยู่” จากครั้งก่อน → รีเฟรชหน้า/ปิดเปิดใหม่แล้วไม่ต้องเข้าสู่ระบบซ้ำ (ล้างทิ้งเมื่อกดออกจากระบบ) */
try{const sid=localStorage.getItem(KEY_SESSION);if(sid)S.me=(DB.users||[]).find(u=>String(u.id)===String(sid))||null}catch(e){S.me=null}
const saveSession=u=>{try{u?localStorage.setItem(KEY_SESSION,u.id):localStorage.removeItem(KEY_SESSION)}catch(e){}};
const $=s=>document.querySelector(s);
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const baht=n=>Number(n).toLocaleString("th-TH")+" บาท";
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2200)}
function go(v,sel){S.view=v;S.sel=sel??null;if(v==="checkout"){S.step=1;S.payName=""}render()}
/* สินค้านี้ปรับแต่งได้ไหม — CUSTOM_ALL=true = ทุกชิ้นปรับแต่งได้ (แอดมินปิดเฉพาะชิ้นได้ด้วย noCustom) · CUSTOM_ALL=false = ปิดการปรับแต่งทั้งร้าน */
const canCustom=p=>!p?false:(CUSTOM_ALL?!p.noCustom:false);
/* รูปสินค้า: แสดงรูปถ้ามี ไม่งั้นใช้ไอคอน (กัน XSS จาก src ที่ไม่ใช่ http/data:image) */
const pImg=p=>p&&p.img&&/^(https?:\/\/|data:image\/)/i.test(p.img)?`<img src="${esc(p.img)}" alt="${esc(p.name||"สินค้า")}" loading="lazy">`:(p?p.icon||"📿":"");
/* ย่อรูปในเครื่องเป็น base64 (สูงสุด max px, jpeg) ลดคุณภาพอัตโนมัติถ้าไฟล์ใหญ่เกิน limit */
function shrinkImage(file,max=1000,q=.8,limit=700000){return new Promise((res,rej)=>{const fr=new FileReader();
 fr.onload=()=>{const im=new Image();
  im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");
   c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const x=c.getContext("2d");
   x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
   try{let out=c.toDataURL("image/jpeg",q);
    while(out.length>limit&&q>.35){q-=.15;out=c.toDataURL("image/jpeg",q)}
    res(out)}catch(e){rej(e)}};
  im.onerror=()=>rej(new Error("เปิดไฟล์รูปไม่ได้"));im.src=fr.result};
 fr.onerror=()=>rej(new Error("อ่านไฟล์ไม่ได้"));fr.readAsDataURL(file)})}
