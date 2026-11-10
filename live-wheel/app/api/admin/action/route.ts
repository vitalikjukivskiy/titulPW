import { db, fail, isHost, json, sameOrigin, settleActive } from "@/lib/show";
import { parseVideoId, weightedIndex } from "@/lib/odds";
import { PLAYERS_SQL, START_DRAW_SQL, randomIndex, ticketSnapshot, type TicketPlayer } from "@/lib/raffle";
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Недозволений запит.",403);
 if(!await isHost(request))return fail("Увійди як ведучий.",401);
 try{
  const input=await request.text();if(input.length>500)return fail("Надто довгий запит.");
  const body=JSON.parse(input) as {action?:string;open?:boolean;id?:number;confirmed?:boolean;url?:unknown};
  if(body.action==="stream"){
   const videoId=body.url===""?null:parseVideoId(body.url);
   if(body.url!==""&&!videoId)return fail("Встав посилання YouTube на конкретний стрім.");
   await db().prepare("INSERT INTO settings(id,video_id) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET video_id=excluded.video_id").bind(videoId).run();
   return json({ok:true,videoId});
  }
  if(body.action==="open"){
   if(await settleActive())return fail("Зачекай завершення крутки.",409);
   await db().prepare("INSERT INTO settings(id,registration_open) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET registration_open=excluded.registration_open").bind(body.open?1:0).run();
   return json({ok:true});
  }
  if(body.action==="remove"){
   if(await settleActive())return fail("Не змінюй список під час крутки.",409);
   if(!Number.isSafeInteger(body.id)||!body.id||body.id<1)return fail("Невірний номер учасника.");
   const removed=await db().prepare(`DELETE FROM players WHERE id=?
    AND NOT EXISTS (SELECT 1 FROM draws WHERE finished_at IS NULL)
    AND NOT EXISTS (SELECT 1 FROM donations WHERE player_id=players.id
      AND round=(SELECT COALESCE(MAX(round),0)+1 FROM draws))`).bind(body.id).run();
   if(!removed.meta.changes)return fail("Не можна прибрати учасника з донатом на наступний раунд або під час крутки.",409);
   return json({ok:true});
  }
  if(body.action==="removeAll"){
   if(body.confirmed!==true)return fail("Підтвердь видалення всіх учасників.");
   if(await settleActive())return fail("Не змінюй список під час крутки.",409);
   const result=await db().prepare(`DELETE FROM players WHERE NOT EXISTS(SELECT 1 FROM draws WHERE finished_at IS NULL)
    AND NOT EXISTS(SELECT 1 FROM donations WHERE player_id IS NOT NULL AND round=(SELECT COALESCE(MAX(round),0)+1 FROM draws))`).run();
   if(!result.meta.changes&&(await db().prepare("SELECT id FROM players LIMIT 1").first()))return fail("Список не очищено: є донати на наступний раунд або крутка вже почалася.",409);
   return json({ok:true,deleted:result.meta.changes});
  }
  if(body.action==="start"){
   if(await settleActive())return fail("Крутка вже триває.",409);
   const people=await db().prepare(PLAYERS_SQL).all<TicketPlayer>();
   const {entries:names,weights}=ticketSnapshot(people.results);
   if(people.results.length<2)return fail("Потрібно хоча б два учасники.",409);
   const winnerIndex=weightedIndex(weights,randomIndex(weights.reduce((a,b)=>a+b,0))),startedAt=Date.now();
   const snapshot=JSON.stringify(names),weightSnapshot=JSON.stringify(weights);
   const result=await db().prepare(START_DRAW_SQL).bind(snapshot,weightSnapshot,winnerIndex,startedAt,snapshot,weightSnapshot).run();
   if(!result.meta.changes)return fail("Список квитків змінився або крутка вже почалася. Онови список і спробуй ще раз.",409);
   await db().prepare("INSERT INTO settings(id,registration_open) VALUES(1,0) ON CONFLICT(id) DO UPDATE SET registration_open=0").run();
   const round=await db().prepare("SELECT round FROM draws WHERE id=?").bind(result.meta.last_row_id).first<{round:number}>();
   return json({entries:names,weights,winnerIndex,round:round?.round,startedAt});
  }
  return fail("Невідома дія.");
 }catch(e){console.error("admin action error",e);return fail("Не вдалося зберегти дію.",503)}
}
