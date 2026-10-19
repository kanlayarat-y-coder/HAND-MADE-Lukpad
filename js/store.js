let DB;
try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){DB=null}
if(!DB)DB=seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB));return true}
 catch(e){if(typeof toast==="function")toast("บันทึกไม่สำเร็จ: พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็ม (ลองลดรูปสินค้า/สลิป หรือกดอัปโหลดขึ้นชีตเพื่อย้ายรูปไป Google Drive)");return false}};
