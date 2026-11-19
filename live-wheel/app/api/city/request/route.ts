import {db,fail,json,sameOrigin} from "@/lib/show";
import {ensureCityTables,houseExists,houseKey,buildingExists,normalizeName,validNickname} from "@/lib/city";
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Недозволений запит.",403);
 try{
  const raw=await request.text();
  if(raw.length>1200)return fail("Завеликий запит.");
  const body=JSON.parse(raw) as {kind?:unknown;supporter?:unknown;targetKey?:unknown;amount?:unknown};
  if(!validNickname(body.supporter))return fail("Вкажи нік від 2 до 36 символів.");
  const supporter=body.supporter.trim().replace(/\s+/g," ");
  const amount=body.amount;
  if(typeof amount!=="number"||!Number.isSafeInteger(amount)||amount<10||amount>100000)return fail("Мінімальний донат — 10 ₴.");
  if(body.kind!=="house"&&body.kind!=="upgrade")return fail("Невірний тип заявки.");
  await ensureCityTables();
  let targetKey="";
  if(body.kind==="house"){
   if(await houseExists(supporter))return fail("Цей будинок уже є у місті. Можеш замовити апгрейд.",409);
   targetKey=houseKey(supporter);
  }else{
   if(typeof body.targetKey!=="string"||body.targetKey.length>130||!await buildingExists(body.targetKey))return fail("Будівлю для апгрейду не знайдено.",404);
   targetKey=body.targetKey;
  }
  const key=normalizeName(supporter),cutoff=Date.now()-86400000;
  const limit=await db().prepare("SELECT COUNT(*) AS n FROM city_orders WHERE supporter_key=? AND status='pending' AND created_at>?").bind(key,cutoff).first<{n:number}>();
  if((limit?.n??0)>=3)return fail("Уже є три заявки, що очікують підтвердження. Звернись до ведучого.",429);
  const created=await db().prepare("INSERT INTO city_orders(supporter,supporter_key,kind,target_key,amount,status,created_at) VALUES(?,?,?,?,?,'pending',?)").bind(supporter,key,body.kind,targetKey,amount,Date.now()).run();
  return json({ok:true,id:Number(created.meta.last_row_id),status:"pending"},201);
 }catch(e){console.error("city request error",e);return fail("Не вдалося створити заявку. Спробуй ще раз.",503)}
}
