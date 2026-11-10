"use client";
import { useEffect, useState, type FormEvent } from "react";
import LiveWheel from "./live-wheel";
type Player={id:number;nickname:string;tickets:number};
type Draw={id:number;round:number;name:string;count:number;ticketCount:number;winnerTickets:number;weights:number[];entries:string[];winnerIndex:number;finishedAt:number};
type State={players:Player[];history:Draw[];active:{round:number;startedAt:number;count:number;ticketCount:number;weights:number[];entries:string[]}|null;entries:string[];totalTickets:number;streamVideoId:string|null;nextRound:number;donation:{enabled:boolean;url:string;code:string|null;priceUAH:number;maxTickets:number};registrationOpen:boolean;myPlayerId:number|null;serverNow:number};
export default function Home(){
 const [data,setData]=useState<State|null>(null),[nick,setNick]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[now,setNow]=useState(0),[offline,setOffline]=useState(false),[clockOffset,setClockOffset]=useState(0);
 async function refresh(){try{const r=await fetch("/api/state",{cache:"no-store"});if(!r.ok)throw Error();const next=await r.json() as State;setClockOffset(next.serverNow-Date.now());setNow(Date.now());setData(next);setOffline(false)}catch{setOffline(true)}}
 useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const p=setInterval(()=>void refresh(),1500),t=setInterval(()=>setNow(Date.now()),250);return()=>{clearTimeout(initial);clearInterval(p);clearInterval(t)}},[]);
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
 const last=data?.history[0],mine=data?.players.find(p=>p.id===data.myPlayerId),remaining=data?.active?Math.max(0,Math.ceil((data.active.startedAt+60000-now-clockOffset)/1000)):0;
 const shownEntries=data?.active?.entries||last?.entries||data?.entries||[];
 const shownWeights=data?.active?.weights||last?.weights||data?.players.map(p=>p.tickets)||[];
 const chance=mine&&data?.totalTickets?new Intl.NumberFormat("uk-UA",{maximumFractionDigits:2}).format(mine.tickets/data.totalTickets*100):"0";
 async function copyCode(){try{await navigator.clipboard.writeText(data?.donation.code||"");setMessage("Код скопійовано. Встав його в повідомлення донату.")}catch{setMessage("Виділи та скопіюй код вручну.")}}
 return <main className="live-page"><div className="live-wrap">
 <header className="live-header"><div className="brand"><b>✦</b><span>ПОЛЕ <em>ЧУДЕС</em><small>РОЗІГРАШ У ПРЯМОМУ ЕФІРІ</small></span></div><span className="status"><i/>{data?.active?"БАРАБАН КРУТИТЬСЯ":"ЧЕКАЄМО НА РАУНД"}</span></header>
 <div className="live-grid"><section className="main-column"><div className="eyebrow">✦ &nbsp; ПРЯМИЙ ЕФІР &nbsp; ✦</div><h1>Твій шанс<br/><span>на барабані.</span></h1><p className="lead">Запишися безкоштовно й отримай один квиток. Підтримка через Donatello додає квитки до наступного розіграшу. Кількість квитків і шанси видно всім.</p>
 <div className="draw-card" aria-live="polite">
  <div className="eyebrow">{data?.active?"РАУНД "+data.active.round+" ТРИВАЄ":last?"ОСТАННЯ КРУТКА":"БАРАБАН ГОТОВИЙ"}</div>
  <LiveWheel weights={shownWeights} entries={shownEntries} active={!!data?.active} startedAt={data?.active?.startedAt} clockOffset={clockOffset} winnerIndex={data?.active?undefined:last?.winnerIndex}/>
  <strong>{data?.active?"Інтрига триває":last?.name||"Перший переможець попереду"}</strong>
  <p>{data?.active?remaining+" с до результату · "+data.active.count+" учасників":last?"Раунд "+last.round+" · "+last.winnerTickets+" із "+last.ticketCount+" квитків":"Слідкуй за ефіром разом із нами"}</p>
  {data?.active&&<div className="progress"><span style={{width:Math.max(0,100-remaining/60*100)+"%"}}/></div>}
 </div></section>
 <aside className="side"><section className="panel"><div className="eyebrow">01 / УЧАСТЬ</div><h2>Записатися на колесо</h2>{!data?<p>{offline?"Немає зв’язку. Онови сторінку.":"Завантажуємо список…"}</p>:mine?<div className="registered"><small>✓ ТИ В СПИСКУ</small><strong>{mine.nickname}</strong><p>Раунд {data.nextRound}: {mine.tickets} квитків із {data.totalTickets}. Поточний шанс — {chance}%. Він змінюється разом зі списком.</p></div>:!data.registrationOpen?<p>Реєстрацію закрито на час раунду. Зачекай.</p>:<form onSubmit={register}><label htmlFor="nick">Нік персонажа в Perfect World</label><input id="nick" minLength={2} maxLength={24} value={nick} onChange={e=>setNick(e.target.value)} placeholder="Наприклад, VitalikPW" required/><button disabled={busy}>{busy?"ЗАПИСУЄМО…":"ВЗЯТИ УЧАСТЬ ↗"}</button><p className="hint">Вказуй свій ігровий нік: за ним ведучий знайде переможця.</p></form>}{message&&<p role="status">{message}</p>}</section>
 <section className="panel donation-panel"><div className="eyebrow">02 / DONATELLO</div><h2>Підтримай ефір</h2>
 {data&&<><p>Кожні <b>{data.donation.priceUAH} грн</b> додають квиток. Максимум — <b>{data.donation.maxTickets} квитків</b> на учасника за раунд разом із безкоштовним.</p>
 <p className="hint">Суми донатів у гривнях за раунд складаються. Понад ліміт додаткових шансів немає. Квитки діють на один раунд; підтвердження після старту зараховується до наступного. Донат не гарантує виграш.</p>
 {!data.donation.enabled?<p role="status">Нарахування за донати ще не підключено. Безкоштовна участь доступна.</p>:!mine?<p>Спочатку запишися на колесо, щоб отримати персональний код.</p>:<>
 <label htmlFor="donation-code">Код для повідомлення донату</label><input id="donation-code" readOnly value={data.donation.code||""} onFocus={e=>e.target.select()}/><button type="button" onClick={copyCode}>КОПІЮВАТИ КОД</button>
 <p className="hint">Встав увесь код у поле «Повідомлення» на Donatello. Після підтвердження квитки з’являться тут автоматично. Якщо код пропущено — звернися до ведучого.</p>
 {mine.tickets>=data.donation.maxTickets?<p className="ticket-limit">Ліміт цього раунду досягнуто. Нові донати не збільшать шанс.</p>:<a className="donation-link" href={data.donation.url} target="_blank" rel="noopener noreferrer">ВІДКРИТИ DONATELLO ↗</a>}
 </>}</>}
 </section>
 <section className="panel"><div className="eyebrow">03 / СПИСОК · {data?.players.length??"—"}</div><h2>Учасники</h2><p className="hint">Раунд {data?.nextRound??"—"} · {data?.totalTickets??0} квитків</p><div className="players">{data?.players.length?data.players.map((p,i)=><div key={p.id}><span>{String(i+1).padStart(2,"0")}</span><strong>{p.nickname}{p.id===data.myPlayerId?" · ТИ":""}</strong><small>{p.tickets} кв. · {new Intl.NumberFormat("uk-UA",{maximumFractionDigits:2}).format(p.tickets/data.totalTickets*100)}%</small></div>):<p>Поки нікого немає. Будь першим!</p>}</div></section></aside></div>
 <section className="panel stream-panel"><div className="eyebrow">YOUTUBE / ЕКРАН СТРІМУ</div><h2>Дивись і грай разом із чатом</h2>
 {data?.streamVideoId?<><div className="stream-frame"><iframe title="YouTube-стрім" src={`https://www.youtube.com/embed/${data.streamVideoId}?playsinline=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div><a href={`https://www.youtube.com/watch?v=${data.streamVideoId}`} target="_blank" rel="noopener noreferrer">Відкрити стрім і поставити лайк на YouTube ↗</a></>:<p>Ведучий ще не вибрав ефір. <a href="https://www.youtube.com/@Vitalik_Juk/live" target="_blank" rel="noopener noreferrer">Перейти на канал @Vitalik_Juk ↗</a></p>}
 <p className="hint">Лайк під YouTube-стрімом ставиться окремо. Квитки за донати відображаються у списку учасників.</p></section>
 <section className="history panel"><div className="eyebrow">АРХІВ ЕФІРУ</div><h2>Історія круток</h2><div className="history-grid">{data?.history.length?data.history.map(d=><article key={d.id}><small>РАУНД {String(d.round).padStart(2,"0")}</small><strong>{d.name}</strong><span>{d.winnerTickets} із {d.ticketCount} квитків · {new Date(d.finishedAt).toLocaleTimeString("uk-UA",{hour:"2-digit",minute:"2-digit"})}</span></article>):<p>Результати з’являться після першої крутки.</p>}</div></section>
 <footer>✦ &nbsp; ПОЛЕ ЧУДЕС <span>Один квиток — один шанс · Переможця визначає випадок</span></footer></div></main>
}
