"use client";
import {useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {DONORS,VERIFIED_DONOR_COUNT,UAH_RECORD_COUNT,PUBLIC_DONATELLO_TOP,type Donor} from "./donor-data";
import {CITY_LANDMARKS} from "./city-landmarks";

type CityMember={name:string;note:string|null};
type CitySnapshot={members:CityMember[];levels:Record<string,number>};
type BuildingFocus={label:string;targetKey:string;level:number;kind:"house"|"landmark";description:string};
type OrderDraft={kind:"house"|"upgrade";targetKey?:string;label:string};
type OrderReceipt={code:string;amount:number;message:string};
type PendingOrder={id:number;supporter:string;kind:string;target_key:string;amount:number;created_at:number};
const donateUrl="https://donatello.to/general_yogik";
const money=(amount:number)=>new Intl.NumberFormat("uk-UA").format(amount)+" ₴";
const norm=(name:string)=>name.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("uk");
const homeKey=(name:string)=>"home:"+norm(name);
const landmarkKey=(name:string)=>"landmark:"+name;
const homes=["🏰","🏡","🏠","🏘️","🏯","🏠","🏡","🏘️","🏛️","🏠","🏡"];
const links=[
 {label:"▶ YouTube",href:"https://www.youtube.com/@Vitalik_Juk"},
 {label:"♫ TikTok",href:"https://www.tiktok.com/@kit_myhaylo"},
 {label:"🟣 Twitch",href:"https://www.twitch.tv/kit_mihaylo"},
 {label:"✈ Telegram",href:"https://t.me/+tMKRFvNot784NGEy"},
 {label:"◎ Instagram",href:"https://www.instagram.com/vitalik_golovnya_/"},
 {label:"🎁 Бонус CyberPW",href:"https://cabinet.cyberpw.fun/register.php?ref=KIT"},
 {label:"💛 Donatello",href:donateUrl}
];
function HostTools({onChanged}:{onChanged:()=>Promise<void>}){
 const [isHost,setIsHost]=useState(false),[orders,setOrders]=useState<PendingOrder[]>([]);
 const [oldNick,setOldNick]=useState(""),[oldNote,setOldNote]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function reload(){
  const r=await fetch("/api/city/admin",{cache:"no-store"});
  if(r.ok){const data=await r.json() as {orders:PendingOrder[]};setOrders(data.orders)}
 }
 useEffect(()=>{
  let active=true;
  void (async()=>{try{const r=await fetch("/api/admin/check",{cache:"no-store"});const data=await r.json() as {host:boolean};if(active&&data.host){setIsHost(true);await reload()}}catch{}})();
  return()=>{active=false};
 },[]);
 async function perform(data:object){
  setBusy(true);setNotice("");
  try{
   const r=await fetch("/api/city/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const body=await r.json() as {error?:string};
   if(!r.ok)throw Error(body.error||"Помилка збереження");
   setNotice("Збережено ✓");setOldNick("");setOldNote("");await reload();await onChanged();
  }catch(e){setNotice(e instanceof Error?e.message:"Не вдалося зберегти")}finally{setBusy(false)}
 }
 if(!isHost)return null;
 return <section className="city-admin" aria-labelledby="city-admin-heading">
  <div className="eyebrow">ТІЛЬКИ ДЛЯ ВЕДУЧОГО · ВХІД ЧЕРЕЗ КОД ВЕДУЧОГО</div>
  <h3 id="city-admin-heading">🛠 Керування містом</h3>
  <p>Підтверджуй заявку лише після перевірки коду MISTO та суми донату в Donatello. Тут немає автоматичної перевірки платежів.</p>
  <button type="button" className="city-plain-btn" onClick={()=>void reload()}>Оновити заявки · {orders.length}</button>
  <div className="city-admin-orders">
   {orders.length===0?<p>Нових заявок поки немає.</p>:orders.map(o=><div className="city-admin-order" key={o.id}>
    <strong>MISTO-{o.id} · {o.supporter}</strong><span>{o.kind==="house"?"🏡 Новий будинок":"⬆ Апгрейд "+o.target_key} · {money(o.amount)}</span>
    <div><button disabled={busy} onClick={()=>{if(window.confirm("Ти перевірив оплату MISTO-"+o.id+" у Donatello?"))void perform({action:"approve",id:o.id})}}>✓ Оплату перевірено</button><button disabled={busy} className="city-decline" onClick={()=>void perform({action:"reject",id:o.id})}>Відхилити</button></div>
   </div>)}
  </div>
  <form className="city-admin-add" onSubmit={e=>{e.preventDefault();void perform({action:"add",nickname:oldNick,note:oldNote})}}>
   <strong>Поселити історичного прихильника без повторного донату</strong>
   <input required minLength={2} maxLength={36} value={oldNick} onChange={e=>setOldNick(e.target.value)} placeholder="Нік прихильника"/>
   <input maxLength={120} value={oldNote} onChange={e=>setOldNote(e.target.value)} placeholder="Примітка (необов’язково)"/>
   <button disabled={busy} type="submit">🏡 Додати будинок</button>
  </form>
  {notice&&<p role="status">{notice}</p>}
 </section>
}
export default function DonorCity(){
 const [query,setQuery]=useState(""),[city,setCity]=useState<CitySnapshot>({members:[],levels:{}});
 const [focus,setFocus]=useState<BuildingFocus|null>(null),[order,setOrder]=useState<OrderDraft|null>(null);
 const [supporter,setSupporter]=useState(""),[amount,setAmount]=useState("10"),[receipt,setReceipt]=useState<OrderReceipt|null>(null);
 const [requestBusy,setRequestBusy]=useState(false),[requestError,setRequestError]=useState(""),[copied,setCopied]=useState(false);
 const buildingDialog=useRef<HTMLDialogElement>(null),orderDialog=useRef<HTMLDialogElement>(null);
 async function refreshCity(){
  try{
   const r=await fetch("/api/city",{cache:"no-store"});
   if(r.ok){const next=await r.json() as CitySnapshot;setCity({members:Array.isArray(next.members)?next.members:[],levels:next.levels||{}})}
  }catch{}
 }
 useEffect(()=>{void refreshCity();const timer=setInterval(()=>void refreshCity(),30000);return()=>clearInterval(timer)},[]);
 const allDonors=useMemo(()=>{
  const entries=new Map(DONORS.map(d=>[norm(d.name),d]));
  for(const m of city.members)if(!entries.has(norm(m.name)))entries.set(norm(m.name),{name:m.name,total:null,count:0,kind:"resident",note:m.note||"Підтримав(ла) проєкт"} as Donor);
  return [...entries.values()];
 },[city.members]);
 const shown=useMemo(()=>allDonors.filter(d=>norm(d.name).includes(norm(query))),[allDonors,query]);
 const level=(key:string)=>Math.max(1,Number(city.levels[key]||1));
 const publicAmount=(name:string)=>PUBLIC_DONATELLO_TOP.find(d=>norm(d.name)===norm(name))?.amount;
 const summary=(d:Donor)=>publicAmount(d.name)?publicAmount(d.name)+" · Donatello":d.total!==null?money(d.total)+" · "+d.count+" дон.":d.note||"Історичний мешканець";
 function showBuilding(next:BuildingFocus){setFocus(next);buildingDialog.current?.showModal()}
 function openHouse(d:Donor){showBuilding({label:d.name,targetKey:homeKey(d.name),level:level(homeKey(d.name)),kind:"house",description:summary(d)})}
 function openLandmark(id:string){
  const site=CITY_LANDMARKS.find(x=>x.id===id);if(!site)return;
  showBuilding({label:site.title,targetKey:landmarkKey(id),level:level(landmarkKey(id)),kind:"landmark",description:"Власники: "+site.owners.join(" + ")+". "+site.note});
 }
 function startOrder(next:OrderDraft){
  buildingDialog.current?.close();setOrder(next);setSupporter("");setAmount("10");setReceipt(null);setRequestError("");setCopied(false);
  orderDialog.current?.showModal();
 }
 async function submitOrder(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!order)return;setRequestBusy(true);setRequestError("");
  try{
   const sum=Number(amount);
   const r=await fetch("/api/city/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:order.kind,supporter:supporter.trim(),targetKey:order.targetKey,amount:sum})});
   const body=await r.json() as {id?:number;error?:string};
   if(!r.ok||!body.id)throw Error(body.error||"Не вдалося створити заявку");
   const code="MISTO-"+body.id;
   const message=code+" | "+(order.kind==="house"?"Будинок: "+supporter.trim():"Апгрейд: "+order.label)+" | Від: "+supporter.trim()+" | "+sum+" грн";
   setReceipt({code,amount:sum,message});
  }catch(e){setRequestError(e instanceof Error?e.message:"Помилка заявки")}finally{setRequestBusy(false)}
 }
 async function copyMessage(){if(!receipt)return;try{await navigator.clipboard.writeText(receipt.message);setCopied(true)}catch{setRequestError("Автокопіювання недоступне. Виділи текст заявки нижче та скопіюй вручну.")}}
 return <section id="misto-donateriv" className="donor-town" aria-labelledby="donor-heading">
  <div className="town-top">
   <div className="town-intro"><span className="eyebrow">✦ ВДЯЧНІСТЬ, ЯКА МАЄ АДРЕСУ</span><h2 id="donor-heading">🏰 Місто донатерів</h2><p>Кожному, хто підтримував проєкт, — власний будинок назавжди. Історичні споруди нікуди не зникають, а всі будівлі можна покращувати!</p></div>
   <div className="town-top-actions"><button className="donor-primary" type="button" onClick={()=>startOrder({kind:"house",label:"Новий будинок"})}>🏡 Замовити будинок · від 10 ₴</button><a className="town-jump" href="#stina-slavy">🏆 На Стіну слави ↓</a></div>
  </div>
  <div className="town-banner" role="note">🏡 {allDonors.length} будинків у відомому списку · {VERIFIED_DONOR_COUNT} донатери з {UAH_RECORD_COUNT} наданих гривневих транзакцій. СедАнтоній: 105 $T окремо. Це ще не повний архів Donatello. Уже підтримував, але не бачиш свій нік? Напиши ведучому — старих прихильників поселяємо без повторного донату.</div>
  <div className="town-visual"><div className="town-sky" aria-hidden="true">✦ &nbsp; ФАЙНА ЮКРАЙНА · КІТ МИХАЙЛО &nbsp; ✦</div><div className="town-castles" aria-hidden="true">🏰　🏠　🏡　🌲　🏛️　🏘️　🌳　🏠　🏡</div><div className="town-map-actions"><button type="button" onClick={()=>startOrder({kind:"house",label:"Новий будинок"})}>🏡 Замовити будинок</button><a href="#stina-slavy">✨ Перенестися на Стіну слави</a></div><div className="town-path">🐈‍⬛ Мер Михайло передає цьомчик кожному мешканцю.</div></div>
  <div className="town-controls"><h3>🏠 Вулиця добрих людей</h3><label className="donor-search-label">Пошук будинку<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Введи нік мешканця…" /></label></div>
  <div className="town-houses">{shown.map(d=>{const pos=allDonors.indexOf(d),lv=level(homeKey(d.name));return <button className={"town-house "+(lv>=2?"town-house-upgraded ":"")+(lv>=4?"town-house-elite":"")} key={norm(d.name)} type="button" onClick={()=>openHouse(d)} aria-label={"Відкрити будинок: "+d.name}><span className="town-level">РІВЕНЬ {lv}</span><span className="town-home-icon" aria-hidden="true">{lv>=5?"🏯":lv>=4?"🏰":lv>=3?"🏡":homes[pos%homes.length]}</span><strong>{d.name}</strong><small>{summary(d)}</small><span className="town-upgrade-hint">⬆ Апгрейд від 10 ₴</span></button>})}{!shown.length&&<p>Будинку з таким ніком поки не знайдено.</p>}</div>
  <div className="town-landmarks"><div><span className="eyebrow">ІСТОРІЯ МІСТА</span><h3>🏛️ Особливі споруди</h3><p>У власників є і персональні будинки, і їхні старі унікальні локації. Кожну споруду також можна апгрейдити від 10 ₴.</p></div><div className="town-landmark-grid">{CITY_LANDMARKS.map(site=><button className={"town-landmark "+(level(landmarkKey(site.id))>=2?"town-landmark-upgraded":"")} type="button" key={site.id} onClick={()=>openLandmark(site.id)}><span className="town-landmark-icon">{site.icon}{level(landmarkKey(site.id))>=3?"✨":""}</span><strong>{site.title}</strong><small>{site.owners.join(" + ")}</small><span className="town-upgrade-hint">Рівень {level(landmarkKey(site.id))} · ⬆ Апгрейд</span></button>)}</div></div>
  <div id="stina-slavy" className="town-honor"><div><span className="eyebrow">НАШІ ЛЕГЕНДИ</span><h3>🏆 Стіна слави</h3><p>Публічний топ із панелі Donatello на Twitch. Суми з ≈ округлені. Їх не змішуємо з частковим списком транзакцій.</p><a className="town-jump" href="#misto-donateriv">↖ Повернутися до міста</a></div><div className="town-podium">{PUBLIC_DONATELLO_TOP.slice(0,3).map((d,i)=><div key={d.name} className="podium-card"><div className="podium-medal">{["🥇","🥈","🥉"][i]}</div><strong>{d.name}</strong><b>{d.amount}</b></div>)}</div><ol className="town-ranking">{PUBLIC_DONATELLO_TOP.slice(3).map(d=><li key={d.name}><span>{d.name}</span><strong>{d.amount}</strong></li>)}</ol><p className="town-secondary-ranking">Решта будинків — у міському реєстрі вище. Стіну слави не продаємо: нові донати не змінюють історичний топ автоматично.</p></div>
  <div className="town-socials"><div><span className="eyebrow">СТРІМИ, ГАЙДИ Й ДОБРІ СПРАВИ</span><h3>Залітай до Кота Михайла</h3></div><nav aria-label="Соціальні мережі й підтримка">{links.map(x=><a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>)}</nav></div>
  <HostTools onChanged={refreshCity}/>
  <dialog ref={buildingDialog} className="house-modal city-building-dialog" onClose={()=>setFocus(null)}><button type="button" aria-label="Закрити будівлю" className="house-close" onClick={()=>buildingDialog.current?.close()}>✕</button><div className="house-modal-emoji">{focus?.kind==="landmark"?"🏛️":"🏡"}</div><small>{focus?.kind==="landmark"?"ІСТОРИЧНА СПОРУДА":"ОСОБИСТИЙ БУДИНОК"}</small><h3>{focus?.label}</h3><div className="city-modal-level">⭐ РІВЕНЬ {focus?.level??1}</div><p>{focus?.description}</p><p>Дякуємо, що ти частина міста Кота Михайла!</p><button type="button" className="city-action-btn" onClick={()=>focus&&startOrder({kind:"upgrade",targetKey:focus.targetKey,label:focus.label})}>⬆ Апгрейдити цю будівлю · від 10 ₴</button></dialog>
  <dialog ref={orderDialog} className="house-modal city-order-dialog" onClose={()=>setOrder(null)}><button type="button" aria-label="Закрити замовлення" className="house-close" onClick={()=>orderDialog.current?.close()}>✕</button><div className="house-modal-emoji">{order?.kind==="house"?"🏡":"🔨"}</div><small>МІСТО КОТА МИХАЙЛА</small><h3>{order?.kind==="house"?"Замовити будинок":"Апгрейдити споруду"}</h3>{order?.kind==="upgrade"&&<p className="city-target">Об&apos;єкт: <strong>{order.label}</strong></p>}
   {!receipt?<form className="city-order-form" onSubmit={submitOrder}><label>Нік {order?.kind==="house"?"майбутнього мешканця":"того, хто підтримує"}<input required minLength={2} maxLength={36} value={supporter} onChange={e=>setSupporter(e.target.value)} placeholder="Твій нік"/></label><label>Сума донату, грн (мінімум 10)<input type="number" required min={10} max={100000} step={1} value={amount} onChange={e=>setAmount(e.target.value)}/></label><p>Спершу створимо код заявки. Після донату в Donatello встав цей код у повідомлення. Ведучий перевірить платіж та підтвердить будівництво.</p><button className="city-action-btn" type="submit" disabled={requestBusy}>{requestBusy?"Створюємо…":"Продовжити · від 10 ₴"}</button></form>:<div className="city-receipt"><p>✅ Заявка <strong>{receipt.code}</strong> створена. Це ще <strong>не підтвердження оплати</strong>.</p><p>Надішли {money(receipt.amount)} на Donatello та встав у повідомлення цей текст:</p><textarea readOnly rows={3} value={receipt.message} aria-label="Текст для донату"/><button type="button" className="city-copy" onClick={()=>void copyMessage()}>{copied?"✓ Скопійовано":"📋 Копіювати повідомлення"}</button><a href={donateUrl} target="_blank" rel="noopener noreferrer" className="city-action-btn">💛 Перейти до Donatello ↗</a><p>Після перевірки ведучим будинок з&apos;явиться на карті або рівень споруди підвищиться. Зазвичай достатньо оновити сторінку.</p></div>}
   {requestError&&<p className="city-order-error" role="alert">{requestError}</p>}
  </dialog>
 </section>
}
