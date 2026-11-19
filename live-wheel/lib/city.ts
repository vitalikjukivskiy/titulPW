import {db} from "@/lib/show";
import {DONORS} from "@/app/donor-data";
import {CITY_LANDMARKS} from "@/app/city-landmarks";

export const normalizeName=(name:string)=>name.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("uk");
export const houseKey=(name:string)=>"home:"+normalizeName(name);
export const landmarkKey=(id:string)=>"landmark:"+id;
export const validNickname=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>=2&&value.trim().length<=36&&!/[\x00-\x1f<>]/.test(value);
export type CityMember={name:string;note:string|null};
export type CityLevel={building_key:string;level:number};
export type CityOrder={id:number;supporter:string;kind:string;target_key:string;amount:number;status:string;created_at:number};

let ready:Promise<void>|null=null;
export async function ensureCityTables(){
 if(!ready)ready=(async()=>{
  const d=db();
  await d.prepare("CREATE TABLE IF NOT EXISTS city_members (name_key TEXT PRIMARY KEY, name TEXT NOT NULL, note TEXT, joined_at INTEGER NOT NULL)").run();
  await d.prepare("CREATE TABLE IF NOT EXISTS city_levels (building_key TEXT PRIMARY KEY, level INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL)").run();
  await d.prepare("CREATE TABLE IF NOT EXISTS city_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, supporter TEXT NOT NULL, supporter_key TEXT NOT NULL, kind TEXT NOT NULL, target_key TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, reviewed_at INTEGER)").run();
  await d.prepare("CREATE INDEX IF NOT EXISTS idx_city_orders_pending ON city_orders(status,created_at)").run();
 })();
 try{await ready}catch(e){ready=null;throw e}
}
export async function houseExists(name:string){
 const n=normalizeName(name);
 if(DONORS.some(d=>normalizeName(d.name)===n))return true;
 const member=await db().prepare("SELECT name_key FROM city_members WHERE name_key=?").bind(n).first();
 return !!member;
}
export async function buildingExists(key:string){
 if(key.startsWith("landmark:"))return CITY_LANDMARKS.some(x=>landmarkKey(x.id)===key);
 if(key.startsWith("home:")){
  const name=key.slice(5);
  if(!name||name.length>90||key!==houseKey(name))return false;
  return houseExists(name);
 }
 return false;
}
