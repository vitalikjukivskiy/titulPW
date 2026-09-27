import { cookie, db, json, settleActive, type Draw, type Player } from "@/lib/show";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const active=await settleActive();
  const [players,draws,setting]=await Promise.all([
   db().prepare("SELECT id, nickname, created_at FROM players ORDER BY id").all<Player>(),
   db().prepare("SELECT * FROM draws WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 50").all<Draw>(),
   db().prepare("SELECT registration_open FROM settings WHERE id = 1").first<{registration_open:number}>(),
  ]);
  const device=cookie(request,"show_device");
  const own=device?await db().prepare("SELECT id FROM players WHERE device_id = ?").bind(device).first<{id:number}>():null;
  return json({players:players.results.map(p=>({id:p.id,nickname:p.nickname,createdAt:p.created_at})),
   history:draws.results.map(d=>{const entries=JSON.parse(d.entries) as string[];return{id:d.id,round:d.round,name:entries[d.winner_index],count:entries.length,finishedAt:d.finished_at}}),
   active:active?{round:active.round,startedAt:active.started_at,count:(JSON.parse(active.entries) as string[]).length}:null,
   registrationOpen:setting?.registration_open!==0&&!active,myPlayerId:own?.id??null,serverNow:Date.now()});
 }catch(e){console.error("state error",e);return json({error:"Тимчасово немає зв’язку з розіграшем."},503)}
}
