"use client";
import { useEffect, useState, type FormEvent } from "react";
type Player={id:number;nickname:string};
type Draw={id:number;round:number;name:string;count:number;finishedAt:number};
type State={players:Player[];history:Draw[];active:{round:number;startedAt:number;count:number}|null;registrationOpen:boolean;myPlayerId:number|null};
export default function Home(){
 const [data,setData]=useState<State|null>(null),[nick,setNick]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[offline,setOffline]=useState(false);
 async function refresh(){try{const r=await fetch("/api/state",{cache:"no-store"});if(!r.ok)throw Error();setData(await r.json() as State);setOffline(false)}catch{setOffline(true)}}
 useEffect(()=>{void refresh();const p=setInterval(()=>void refresh(),3000),t=setInterval(()=>setNow(Date.now()),250);return()=>{clearInterval(p);clearInterval(t)}},[]);
 useEffect(()=>{
  const ctx=(document as Document & {modelContext?:{registerTool:(tool:object,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
  if(!ctx?.registerTool)return;
  const controller=new AbortController();
  void Promise.resolve(ctx.registerTool({name:"register_for_draw",title:"Записатися на розіграш",description:"Записати ігровий нік до поточного списку учасників колеса.",inputSchema:{type:"object",properties:{nickname:{type:"string",minLength:2,maxLength:24}},required:["nickname"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{
   const name=(input as {nickname?:unknown})?.nickname;
   if(typeof name!=="string"||name.length<2||name.length>24)throw Error("Нік має містити 2–24 символи.");
   const r=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nickname:name})});
   const result=await r.json() as {error?:string};if(!r.ok)throw Error(result.error||"Не вдалося записатися.");
   await refresh();return{registered:true,nickname:name};
  }},{signal:controller.signal})).catch(()=>{});
  return()=>controller.abort();
 },[]);
 async function register(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const r=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nickname:nick})});const x=await r.json() as {error?:string};if(!r.ok)throw Error(x.error||"Не вдалося записатися.");setMessage("Ти в списку! Стеж за результатом тут.");setNick("");await refresh()}catch(e){setMessage(e instanceof Error?e.message:"Спробуй ще раз.")}finally{setBusy(false)}}
 const last=data?.history[0],mine=data?.players.find(p=>p.id===data.myPlayerId),remaining=data?.active?Math.max(0,Math.ceil((data.active.startedAt+60000-now)/1000)):0;
 return <main className="live-page"><div className="live-wrap">
 <header className="live-header"><div className="brand"><b>✦</b><span>ПОЛЕ <em>ЧУДЕС</em><small>РОЗІГРАШ У ПРЯМОМУ ЕФІРІ</small></span></div><span className="status"><i/>{data?.active?"БАРАБАН КРУТИТЬСЯ":"ЧЕКАЄМО НА РАУНД"}</span></header>
 <div className="live-grid"><section className="main-column"><div className="eyebrow">✦ &nbsp; ПРЯМИЙ ЕФІР &nbsp; ✦</div><h1>Твій шанс<br/><span>на барабані.</span></h1><p className="lead">Впиши нік персонажа, щоб потрапити до наступної крутки. Результат з’явиться тут одразу після завершення раунду.</p>
 <div className="draw-card" aria-live="polite"><div className="eyebrow">{data?.active?"РАУНД "+data.active.round+" ТРИВАЄ":last?"ОСТАННЯ КРУТКА":"БАРАБАН ГОТОВИЙ"}</div><div className={data?.active?"symbol turning":"symbol"}>{data?.active?"◌":"✦"}</div><strong>{data?.active?"Інтрига триває":last?.name||"Перший переможець попереду"}</strong><p>{data?.active?remaining+" с до результату · "+data.active.count+" учасників":last?"Раунд "+last.round+" · 1 із "+last.count:"Слідкуй за ефіром разом із нами"}</p>{data?.active&&<div className="progress"><span style={{width:Math.max(0,100-remaining/60*100)+"%"}}/></div>}</div></section>
 <aside className="side"><section className="panel"><div className="eyebrow">01 / УЧАСТЬ</div><h2>Записатися на колесо</h2>{!data?<p>{offline?"Немає зв’язку. Онови сторінку.":"Завантажуємо список…"}</p>:mine?<div className="registered"><small>✓ ТИ В СПИСКУ</small><strong>{mine.nickname}</strong><p>Один нік — одна заявка. Твоя участь збережена.</p></div>:!data.registrationOpen?<p>Реєстрацію закрито на час раунду. Зачекай.</p>:<form onSubmit={register}><label htmlFor="nick">Нік персонажа в Perfect World</label><input id="nick" minLength={2} maxLength={24} value={nick} onChange={e=>setNick(e.target.value)} placeholder="Наприклад, VitalikPW" required/><button disabled={busy}>{busy?"ЗАПИСУЄМО…":"ВЗЯТИ УЧАСТЬ ↗"}</button><p className="hint">Вказуй свій ігровий нік: за ним ведучий знайде переможця.</p></form>}{message&&<p role="status">{message}</p>}</section>
 <section className="panel"><div className="eyebrow">02 / СПИСОК · {data?.players.length??"—"}</div><h2>Учасники</h2><div className="players">{data?.players.length?data.players.map((p,i)=><div key={p.id}><span>{String(i+1).padStart(2,"0")}</span><strong>{p.nickname}</strong>{p.id===data.myPlayerId&&<small>ТИ</small>}</div>):<p>Поки нікого немає. Будь першим!</p>}</div></section></aside></div>
 <section className="history panel"><div className="eyebrow">АРХІВ ЕФІРУ</div><h2>Історія круток</h2><div className="history-grid">{data?.history.length?data.history.map(d=><article key={d.id}><small>РАУНД {String(d.round).padStart(2,"0")}</small><strong>{d.name}</strong><span>1 із {d.count} · {new Date(d.finishedAt).toLocaleTimeString("uk-UA",{hour:"2-digit",minute:"2-digit"})}</span></article>):<p>Результати з’являться після першої крутки.</p>}</div></section>
 <footer>✦ &nbsp; ПОЛЕ ЧУДЕС <span>Одна заявка на учасника · Переможця визначає випадок</span></footer></div></main>
}
