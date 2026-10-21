const FLOW=["รอชำระเงิน","ตรวจสอบชำระเงินแล้ว","กำลังจัดทำ","จัดส่งแล้ว","สำเร็จ"];
const CUSTOM={color:["ชมพู","ฟ้า","ม่วง","ขาว"],size:["S (15–16 ซม.)","M (17–18 ซม.)","L (19–20 ซม.)"],pattern:["ดอกไม้","หัวใจ","ดาว","ผีเสื้อ"]};
/* true = ทุกสินค้าในระบบเปิดให้ปรับแต่งได้ (สี/ขนาด/ลาย/ตัวอักษร) · ปิดเฉพาะชิ้นได้ที่หน้า "จัดการสินค้า" (ช่อง "ปิดการปรับแต่งสินค้านี้") · false = ปิดการปรับแต่งทั้งร้าน */
const CUSTOM_ALL=true;
const CUSTOM_FEE=5,KEY="lukpad_v1",KEY_SESSION="lukpad_session";
/* Web App URL ของ Apps Script (ส่วนขยาย → Apps Script → Deploy เป็น Web app)
   วางที่นี่ครั้งเดียว = ทุกเครื่อง/ทุกคนที่เปิดเว็บนี้ซิงก์กับสเปรดชีตเดียวกัน (ค่าในหน้า "ซิงก์ชีต" เฉพาะเครื่องจะเขียนทับช่องนี้) */
const SHEET_URL="https://script.google.com/macros/s/AKfycbx-XDO4meR9se2wXeUDRkcLOwLwHJAfEm5BKsMQF0D9OY3DJJavpepbPPJZ5gSZdVr6/exec";
/* ลิงก์โฟลเดอร์ Google Drive ที่เก็บ "สลิปโอนเงิน" (ให้ตรงกับ FOLDERS.slips ใน gs/Code.gs)
   ใช้ทำปุ่ม "เปิดโฟลเดอร์สลิปใน Drive" ในหน้าแอดมิน · เว้นว่าง "" ได้ถ้ายังไม่ต้องการ */
const SLIP_FOLDER_URL="https://drive.google.com/drive/folders/1bNa8AbI-92b9MoiEa-9YMJWr83ON26G_";
const seed=()=>({
 users:[{id:1001,name:"ลูกค้าตัวอย่าง",email:"hello@gmail.com",password:"1234",phone:"0812345678",address:"99/12 ม.3 ต.ขนอม จ.นครศรีธรรมราช 80210",role:"customer"},
        {id:1002,name:"ผู้ดูแลร้าน",email:"admin@lukpad.com",password:"admin1234",phone:"",address:"",role:"admin"}],
 products:[
  {id:2001,name:"สร้อยข้อมือลูกปัดดอกไม้",category:"สร้อยข้อมือ",icon:"📿",img:"",price:159,ship:59,size:"Free Size ปรับได้",desc:"ผลิตจากลูกปัดแก้วและอะคริลิก ร้อยด้วยมือทุกชิ้น",custom:true},
  {id:2002,name:"สร้อยคอลูกปัดหิน",category:"สร้อยคอ",icon:"💎",img:"",price:249,ship:59,size:"Free Size ปรับได้",desc:"ลูกปัดหินแท้ตกแต่งด้วยจี้ต่าง ๆ",custom:true},
  {id:2003,name:"พวงกุญแจลูกปัดการ์ตูน",category:"พวงกุญแจ",icon:"🔑",img:"",price:129,ship:59,size:"8 ซม.",desc:"พวงกุญแจร้อยลูกปัดแฮนด์เมดลายการ์ตูน",custom:true},
  {id:2004,name:"ข้อเท้าลูกปัด",category:"ข้อเท้า",icon:"🌸",img:"",price:159,ship:59,size:"Free Size ปรับได้",desc:"ข้อเท้าแบบเชือกถักตกแต่งด้วยลูกปัดหิน",custom:true},
  {id:2005,name:"สายคล้องโทรศัพท์ลูกปัด",category:"สายคล้อง",icon:"📱",img:"",price:139,ship:59,size:"20 ซม.",desc:"สายคล้องโทรศัพท์ลูกปัดแฮนด์เมด พร้อมห่วงคล้อง",custom:true}],
 orders:[],nextOrder:3001,nextUser:1003,nextProduct:2006,
 bank:{bank:"กรุงไทย",name:"จันทิมาธร จันทจิตต์",no:"0123456789"}});
