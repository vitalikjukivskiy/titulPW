import { db, fail, isHost, json, sameOrigin, settleActive, type Player } from "@/lib/show";
function randomIndex(n:number){const x=new Uint32Array(1),limit=Math.floor(0x100000000/n)*n;do{crypto.getRandomValues(x)}while(x[0]>=limit);return x[0]%n}
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Недозволений запит.",403);
 if(!await isHost(request))return fail("Увійди як ведучий.",401);
 try{
  const input=await request.text();if(input.length>500)return fail("Надто довгий запит.");
  const body=JSON.parse(input) as {action?:string;open?:boolean;id?:number};
  if(body.action==="open"){
   if(await settleActive())return fail("Зачекай завершення крутки.",409);
   await db().prepare("INSERT INTO settings(id,registration_open) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET registration_open=excluded.registration_open").bind(body.open?1:0).run();
   return json({ok:true});
  }
  if(body.action==="remove"){
   if(await settleActive())return fail("Не змінюй список під час крутки.",409);
   if(!Number.isSafeInteger(body.id)||!body.id||body.id<1)return fail("Невірний номер учасника.");
   await db().prepare("DELETE FROM players WHERE id=?").bind(body.id).run();return json({ok:true});
  }
  if(body.action==="start"){
   if(await settleActive())return fail("Крутка вже триває.",409);
   const people=await db().prepare("SELECT id,nickname,created_at FROM players ORDER BY id").all<Player>();
   const names=people.results.map(p=>p.nickname);
   if(names.length<2)return fail("Потрібно хоча б два учасники.",409);
   const winnerIndex=randomIndex(names.length),startedAt=Date.now();
   const result=await db().prepare("INSERT INTO draws(round,entries,winner_index,started_at) SELECT COALESCE((SELECT MAX(round)+1 FROM draws),1),?,?,? WHERE NOT EXISTS(SELECT 1 FROM draws WHERE finished_at IS NULL)").bind(JSON.stringify(names),winnerIndex,startedAt).run();
   if(!result.meta.changes)return fail("Крутка вже почалася.",409);
   await db().prepare("INSERT INTO settings(id,registration_open) VALUES(1,0) ON CONFLICT(id) DO UPDATE SET registration_open=0").run();
   const round=await db().prepare("SELECT round FROM draws WHERE id=?").bind(result.meta.last_row_id).first<{round:number}>();
   return json({entries:names,winnerIndex,round:round?.round,startedAt});
  }
  return fail("Невідома дія.");
 }catch(e){console.error("admin action error",e);return fail("Не вдалося зберегти дію.",503)}
}
