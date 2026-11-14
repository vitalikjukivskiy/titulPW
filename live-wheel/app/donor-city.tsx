"use client";
import {useMemo,useRef,useState} from "react";
import {DONORS,VERIFIED_DONOR_COUNT,UAH_RECORD_COUNT,PUBLIC_DONATELLO_TOP,type Donor} from "./donor-data";

const money=(amount:number)=>new Intl.NumberFormat("uk-UA").format(amount)+" ₴";
const homes=["🏰","🏡","🏠","🏘️","🏯","🏠","🏡","🏘️","🏛️","🏠","🏡"];
const links=[
{label:"▶ YouTube",href:"https://www.youtube.com/@Vitalik_Juk"},
{label:"♫ TikTok",href:"https://www.tiktok.com/@kit_myhaylo"},
{label:"🟣 Twitch",href:"https://www.twitch.tv/kit_mihaylo"},
{label:"✈ Telegram",href:"https://t.me/+tMKRFvNot784NGEy"},
{label:"◎ Instagram",href:"https://www.instagram.com/vitalik_golovnya_/"},
{label:"🎁 Бонус CyberPW",href:"https://cabinet.cyberpw.fun/register.php?ref=KIT"},
{label:"💛 Donatello",href:"https://donatello.to/general_yogik"}
];
export default function DonorCity(){
 const [query,setQuery]=useState("");const [chosen,setChosen]=useState<Donor|null>(null);
 const modal=useRef<HTMLDialogElement>(null);
 const sorted=useMemo(()=>DONORS.filter(d=>d.name.toLocaleLowerCase("uk").includes(query.trim().toLocaleLowerCase("uk"))),[query]);
 const publicAmount=(name:string)=>PUBLIC_DONATELLO_TOP.find(d=>d.name.toLocaleLowerCase("uk")===name.toLocaleLowerCase("uk"))?.amount;
 function openHouse(d:Donor){setChosen(d);modal.current?.showModal()}
 const summary=(d:Donor)=>publicAmount(d.name) ? publicAmount(d.name)+" · Donatello" : d.total!==null?money(d.total)+" · "+d.count+" дон.":d.note||"Історичний мешканець";
 return <section id="misto-donateriv" className="donor-town" aria-labelledby="donor-heading">
  <div className="town-top"><div className="town-intro"><span className="eyebrow">✦ ВДЯЧНІСТЬ, ЯКА МАЄ АДРЕСУ</span><h2 id="donor-heading">🏰 Місто донатерів</h2><p>У кожного — власний будиночок. Маленький донат чи великий: у нашому місті ніхто не живе в підвалі Топчика.</p></div>
   <a className="donor-primary" href="https://donatello.to/general_yogik" target="_blank" rel="noopener noreferrer">💛 Донат на розвиток міста ↗</a>
  </div>
  <div className="town-banner" role="note">🏡 {DONORS.length} персональних будинків · {VERIFIED_DONOR_COUNT} донатерів у наданих гривневих записах · {UAH_RECORD_COUNT} платежів із часткового списку. СедАнтоній: ще 105 $T окремо. У публічному топі Donatello суми можуть бути округлені.</div>
  <div className="town-visual" aria-hidden="true"><div className="town-sky">✦ &nbsp; КІТ МИХАЙЛО CITY &nbsp; ✦</div><div className="town-castles">🏰　🏠　🏡　🌲　🏛️　🏘️　🌳　🏠　🏡</div><div className="town-path">🐈‍⬛ Мер Михайло передає всім цьомчик. Навіть тим, хто донатив на Роллтон.</div></div>
  <div className="town-controls"><h3>🏠 Вулиця добрих людей</h3><label className="donor-search-label">Пошук будинку<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Введи нік мешканця…" /></label></div>
  <div className="town-houses">{sorted.map((d)=>{const pos=DONORS.indexOf(d);return <button className="town-house" key={d.name} type="button" onClick={()=>openHouse(d)} aria-label={"Відкрити будинок: "+d.name}><span className="town-home-icon" aria-hidden="true">{homes[pos%homes.length]}</span><strong>{d.name}</strong><small>{summary(d)}</small></button>})}{sorted.length===0&&<p>Такого будинку поки не знайдено.</p>}</div>
  <div className="town-honor"><div><span className="eyebrow">НАШІ ЛЕГЕНДИ</span><h3>🏆 Стіна пошани</h3><p>Публічний топ із панелі Donatello на Twitch. Суми з позначкою ≈ округлені. Не змішуємо його з частковим списком транзакцій.</p></div><div className="town-podium">{PUBLIC_DONATELLO_TOP.slice(0,3).map((d,i)=><div key={d.name} className="podium-card"><div className="podium-medal">{["🥇","🥈","🥉"][i]}</div><strong>{d.name}</strong><b>{d.amount}</b></div>)}</div><ol className="town-ranking">{PUBLIC_DONATELLO_TOP.slice(3).map(d=><li key={d.name}><span>{d.name}</span><strong>{d.amount}</strong></li>)}</ol><p className="town-secondary-ranking">Інші суми, показані на будиночках, узято лише з наданих записів; вони можуть не містити всіх донатів.</p></div>  <div className="town-socials"><div><span className="eyebrow">СТРІМИ, ГАЙДИ Й ДОБРІ СПРАВИ</span><h3>Залітай до Кота Михайла</h3></div><nav aria-label="Соціальні мережі й підтримка">{links.map(x=><a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>)}</nav><p>Discord додамо після підтвердження запрошення — без вигаданих посилань.</p></div>
  <dialog ref={modal} className="house-modal" onClose={()=>setChosen(null)}><button type="button" aria-label="Закрити будиночок" className="house-close" onClick={()=>modal.current?.close()}>✕</button><div className="house-modal-emoji">🏡</div><small>ОСОБИСТИЙ БУДИНОК</small><h3>{chosen?.name}</h3><p>{chosen?summary(chosen):""}</p><p>Дякуємо, що ти частина міста Кота Михайла! Тут завжди знайдеться місце для своїх.</p><a href="https://donatello.to/general_yogik" target="_blank" rel="noopener noreferrer">💛 Підтримати місто на Donatello ↗</a></dialog>
 </section>
}
