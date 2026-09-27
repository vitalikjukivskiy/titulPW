import { env } from "cloudflare:workers";
import { fail, json, sameOrigin, signature } from "@/lib/show";
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Недозволений запит.",403);
 try{
  const input=await request.text();if(input.length>200)return fail("Невірний код.",403);
  const {pin}=JSON.parse(input) as {pin:unknown};
  if(typeof pin!=="string"||!env.ADMIN_PIN||pin.length!==env.ADMIN_PIN.length)return fail("Невірний код ведучого.",403);
  let diff=0;for(let i=0;i<pin.length;i++)diff|=pin.charCodeAt(i)^env.ADMIN_PIN.charCodeAt(i);
  if(diff)return fail("Невірний код ведучого.",403);
  return json({ok:true},200,{"Set-Cookie":`show_host=${await signature("host")}; Path=/; HttpOnly; ${new URL(request.url).protocol==="https:"?"Secure; ":""}SameSite=Strict; Max-Age=43200`});
 }catch{return fail("Невірний код ведучого.",403)}
}
