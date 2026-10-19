let DB;
try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){DB=null}
if(!DB)DB=seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}};
