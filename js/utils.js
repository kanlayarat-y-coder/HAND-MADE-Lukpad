const S={me:null,view:"login",cart:[],sel:null,mode:"login"};
const $=s=>document.querySelector(s);
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const baht=n=>Number(n).toLocaleString("th-TH")+" บาท";
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2200)}
function go(v,sel){S.view=v;S.sel=sel??null;render()}
/* รูปสินค้า: แสดงรูปถ้ามี ไม่งั้นใช้ไอคอน (กัน XSS จาก src ที่ไม่ใช่ http/data:image) */
const pImg=p=>p&&p.img&&/^(https?:\/\/|data:image\/)/i.test(p.img)?`<img src="${esc(p.img)}" alt="${esc(p.name||"สินค้า")}" loading="lazy">`:(p?p.icon||"📿":"");
/* ย่อรูปในเครื่องเป็น base64 (สูงสุด max px, jpeg 0.8) เพื่อเก็บลง localStorage/อัปโหลดต่อ */
function shrinkImage(file,max=1000){return new Promise((res,rej)=>{const fr=new FileReader();
 fr.onload=()=>{const im=new Image();
  im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");
   c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const x=c.getContext("2d");
   x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
   try{res(c.toDataURL("image/jpeg",.8))}catch(e){rej(e)}};
  im.onerror=()=>rej(new Error("เปิดไฟล์รูปไม่ได้"));im.src=fr.result};
 fr.onerror=()=>rej(new Error("อ่านไฟล์ไม่ได้"));fr.readAsDataURL(file)})}
