import { env } from "cloudflare:workers";
export function db(){if(!env.DB)throw new Error("DB binding unavailable");return env.DB}
export function json(data:unknown,status=200,headers?:HeadersInit){return Response.json(data,{status,headers:{"Cache-Control":"no-store",...headers}})}
export function fail(message:string,status=400){return json({error:message},status)}
export function cookie(request:Request,name:string){return request.headers.get("cookie")?.match(new RegExp("(?:^|; )"+name+"=([^;]*)"))?.[1]||""}
export async function signature(value:string){
 const secret=env.SESSION_SECRET;if(!secret)throw Error("SESSION_SECRET missing");
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value)));
 return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function isHost(request:Request){
 const token=cookie(request,"show_host"),expected=await signature("host");
 if(token.length!==expected.length)return false;
 let diff=0;for(let i=0;i<token.length;i++)diff|=token.charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
export function sameOrigin(request:Request){return request.headers.get("origin")===new URL(request.url).origin}
export type Player={id:number;nickname:string;created_at:number};
export type Draw={id:number;round:number;entries:string;winner_index:number;started_at:number;finished_at:number|null};
export async function settleActive(){
 const q=await db().prepare("SELECT * FROM draws WHERE finished_at IS NULL ORDER BY id DESC LIMIT 1").first<Draw>();
 if(q&&Date.now()>=q.started_at+60000){await db().prepare("UPDATE draws SET finished_at = ? WHERE id = ? AND finished_at IS NULL").bind(q.started_at+60000,q.id).run();q.finished_at=q.started_at+60000}
 return q?.finished_at===null?q:null;
}
