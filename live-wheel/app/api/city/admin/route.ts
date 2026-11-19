import {db,fail,isHost,json,sameOrigin} from "@/lib/show";
import {buildingExists,ensureCityTables,houseExists,normalizeName,validNickname,type CityOrder} from "@/lib/city";
export async function GET(request:Request){
 if(!await isHost(request))return fail("Потрібен вхід ведучого.",401);
 try{
  await ensureCityTables();
  const rows=await db().prepare("SELECT id,supporter,kind,target_key,amount,status,created_at FROM city_orders WHERE status='pending' ORDER BY id ASC LIMIT 100").all<CityOrder>();
  return json({orders:rows.results});
 }catch(e){console.error("city admin GET",e);return fail("Не вдалося прочитати заявки.",503)}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Недозволений запит.",403);
 if(!await isHost(request))return fail("Потрібен вхід ведучого.",401);
 try{
  const raw=await request.text();if(raw.length>1500)return fail("Завеликий запит.");
  const body=JSON.parse(raw) as {action?:unknown;id?:unknown;nickname?:unknown;note?:unknown};
  await ensureCityTables();
  if(body.action==="add"){
   if(!validNickname(body.nickname))return fail("Нік має містити 2–36 символів.");
   const nickname=body.nickname.trim().replace(/\s+/g," ");
   if(await houseExists(nickname))return fail("Будинок для цього ніку вже є.",409);
   const note=typeof body.note==="string"?body.note.trim().slice(0,120):"Історичний прихильник проєкту";
   await db().prepare("INSERT INTO city_members(name_key,name,note,joined_at) VALUES(?,?,?,?)").bind(normalizeName(nickname),nickname,note,Date.now()).run();
   return json({ok:true});
  }
  if(body.action!=="approve"&&body.action!=="reject")return fail("Невідома дія.");
  if(typeof body.id!=="number"||!Number.isSafeInteger(body.id)||body.id<1)return fail("Невірний номер заявки.");
  const order=await db().prepare("SELECT id,supporter,kind,target_key,amount,status,created_at FROM city_orders WHERE id=?").bind(body.id).first<CityOrder>();
  if(!order||order.status!=="pending")return fail("Заявку вже оброблено або її не знайдено.",409);
  if(body.action==="reject"){
   await db().prepare("UPDATE city_orders SET status='rejected',reviewed_at=? WHERE id=? AND status='pending'").bind(Date.now(),order.id).run();
   return json({ok:true});
  }
  // Оплату звіряє ведучий у Donatello перед натисканням «Підтвердити».
  if(order.kind==="house"){
   if(await houseExists(order.supporter))return fail("Будинок вже існує. Відхили дубль або оформи апгрейд.",409);
   await db().batch([
    db().prepare("INSERT INTO city_members(name_key,name,note,joined_at) VALUES(?,?,?,?)").bind(normalizeName(order.supporter),order.supporter,"Новий мешканець міста",Date.now()),
    db().prepare("UPDATE city_orders SET status='approved',reviewed_at=? WHERE id=? AND status='pending'").bind(Date.now(),order.id)
   ]);
  }else if(order.kind==="upgrade"){
   if(!await buildingExists(order.target_key))return fail("Будівлю для апгрейду не знайдено.",409);
   await db().batch([
    db().prepare("INSERT INTO city_levels(building_key,level,updated_at) VALUES(?,2,?) ON CONFLICT(building_key) DO UPDATE SET level=city_levels.level+1,updated_at=excluded.updated_at").bind(order.target_key,Date.now()),
    db().prepare("UPDATE city_orders SET status='approved',reviewed_at=? WHERE id=? AND status='pending'").bind(Date.now(),order.id)
   ]);
  }else return fail("Невідомий тип заявки.",400);
  return json({ok:true});
 }catch(e){console.error("city admin POST",e);return fail("Не вдалося обробити заявку.",503)}
}
