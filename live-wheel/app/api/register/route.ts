import { cookie, db, fail, json, sameOrigin, settleActive } from "@/lib/show";
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Недозволений запит.",403);
 try{
  const input=await request.text();if(input.length>500)return fail("Надто довгий запит.");
  const {nickname}=JSON.parse(input) as {nickname:unknown};
  if(typeof nickname!=="string")return fail("Введи нік персонажа.");
  const name=nickname.normalize("NFKC").trim().replace(/\s+/g," ");
  if(name.length<2||name.length>24||! /^[\p{L}\p{N}_ .-]+$/u.test(name))return fail("Нік: 2–24 символи, літери, цифри, пробіл, _, крапка або дефіс.");
  const nameKey=name.toLocaleLowerCase("uk-UA");
  if(await settleActive())return fail("Крутка вже триває. Дочекайся наступної.",409);
  const existing=cookie(request,"show_device");
  if(existing&&await db().prepare("SELECT id FROM players WHERE device_id = ?").bind(existing).first())return fail("Ти вже записався. Одна заявка на пристрій.",409);
  const device=existing&&/^[a-f0-9-]{36}$/.test(existing)?existing:crypto.randomUUID();
  const result=await db().prepare("INSERT INTO players (nickname,name_key,device_id,created_at) SELECT ?,?,?,? WHERE COALESCE((SELECT registration_open FROM settings WHERE id=1),1)=1 AND NOT EXISTS (SELECT 1 FROM draws WHERE finished_at IS NULL) AND (SELECT COUNT(*) FROM players)<100")
   .bind(name,nameKey,device,Date.now()).run();
  if(!result.meta.changes)return fail("Реєстрація закрита або список заповнений.",409);
  return json({ok:true},201,{"Set-Cookie":`show_device=${device}; Path=/; HttpOnly; ${new URL(request.url).protocol==="https:"?"Secure; ":""}SameSite=Lax; Max-Age=2592000`});
 }catch(e){if(String(e).includes("UNIQUE"))return fail("Такий нік уже в списку.",409);console.error("register error",e);return fail("Не вдалося записати. Спробуй пізніше.",503)}
}
