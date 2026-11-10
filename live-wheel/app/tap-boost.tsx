"use client";
import {useEffect,useRef,useState} from "react";
export default function TapBoost({playerId,taps,locked,offline}:{playerId:number|null;taps:number;locked:boolean;offline:boolean}){
 const [shown,setShown]=useState(taps),[saved,setSaved]=useState(taps),[error,setError]=useState("");
 const progress=useRef({id:playerId,desired:taps,saved:taps,busy:false});
 useEffect(()=>{progress.current={id:playerId,desired:taps,saved:taps,busy:false};setShown(taps);setSaved(taps);setError("")},[playerId]);
 useEffect(()=>{const p=progress.current;p.saved=Math.max(p.saved,taps);p.desired=Math.max(p.desired,taps);setSaved(p.saved);setShown(p.desired)},[taps]);
 useEffect(()=>{
 const timer=setInterval(async()=>{
  const p=progress.current;if(!p.id||p.busy||p.saved>=p.desired||locked||offline)return;
  p.busy=true;const target=Math.min(200,p.saved+10,p.desired);
  try{
   const r=await fetch("/api/tap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({target})});
   const x=await r.json() as {taps:number;error?:string};if(!r.ok)throw Error(x.error||"Не вдалося зберегти тапи.");
   if(progress.current!==p)return;p.saved=x.taps;setSaved(x.taps);setError("");
  }catch(e){if(progress.current===p)setError(e instanceof Error?e.message:"Немає зв’язку. Повторюємо збереження…")}
  finally{p.busy=false}
 },450);return()=>clearInterval(timer);
 },[locked,offline]);
 function tap(){const p=progress.current;if(!p.id||locked||offline||p.desired>=200)return;p.desired++;setShown(p.desired)}
 const boosted=saved>=200;
 return <section className={"panel tap-panel"+(boosted?" boosted":"")}><div className="eyebrow">02 / ЗАРЯДИ УДАЧУ</div>
 <h2>{boosted?"Бонус активовано ✦":"Натапай свій бонус"}</h2>
 <button className="tap-screen" type="button" onClick={tap} disabled={!playerId||locked||offline||shown>=200} aria-label="Додати один тап до бонусу">
 <span aria-hidden="true">{boosted?"✦":"♡"}</span><strong>{shown}<small> / 200</small></strong><em>{boosted?"ВАГА ×1,2":shown>=200?"ЗБЕРІГАЄМО…":"ТАПАЙ ПО ЕКРАНЧИКУ"}</em></button>
 <progress max={200} value={shown} aria-label="Прогрес до 200 тапів"/>
 <p className="tap-message" role="status">{!playerId?"Спочатку впиши нік вище, потім тапай." : offline?"Немає зв’язку. Тапи тимчасово на паузі.":locked?"Тапи на паузі. Для поточного раунду бонуси зафіксовані.":boosted?"200 тапів збережено. Твоя вага в розіграші +20%.":shown>saved?`Зберігаємо: ${saved} із ${shown} тапів.`:`Ще ${200-shown} тапів до бонусу +20%.`}</p>
 {error&&<p role="alert">{error}</p>}
 <details><summary>Як працює бонус?</summary><p>Звичайна вага — 5, після 200 тапів — 6 (×1,2). Шанс = твоя вага / сума ваг усіх учасників. Наприклад, ти з бонусом проти одного без бонусу: 6/11 = 54,55%. Якщо бонус є у всіх, шанси рівні. Бонус діє до видалення твоєї заявки.</p><p>Це ігрові тапи на сайті. Вони не додають лайків до YouTube.</p></details></section>
}
