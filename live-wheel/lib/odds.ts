export const TAP_GOAL=200;
export function weightFor(taps:number){return taps>=TAP_GOAL?6:5}
export function weightedIndex(weights:number[],ticket:number){
 if(!weights.length||weights.some(w=>!Number.isSafeInteger(w)||w<=0))throw Error("Invalid weights");
 const total=weights.reduce((a,b)=>a+b,0);
 if(!Number.isSafeInteger(ticket)||ticket<0||ticket>=total)throw Error("Invalid ticket");
 let sum=0;for(let i=0;i<weights.length;i++){sum+=weights[i];if(ticket<sum)return i}throw Error("Invalid draw");
}
export function sectors(weights:number[]){
 const total=weights.reduce((a,b)=>a+b,0);let edge=-(weights[0]||0)/total/2;
 return weights.map(w=>{const width=w/total,start=edge;edge+=width;return{start,width,middle:start+width/2}});
}
export function parseVideoId(value:unknown):string|null{
 if(typeof value!=="string")return null;
 if(/^[\w-]{11}$/.test(value))return value;
 try{const u=new URL(value);if(u.protocol!=="https:")return null;
 const h=u.hostname.toLowerCase();
 const id=h==="youtu.be"?u.pathname.split("/")[1]:["youtube.com","www.youtube.com","m.youtube.com"].includes(h)?u.searchParams.get("v")||(/^\/(live|embed|shorts)\//.test(u.pathname)?u.pathname.split("/")[2]:null):null;
 return id&&/^[\w-]{11}$/.test(id)?id:null;
 }catch{return null}
}
