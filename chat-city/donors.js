// Публічні нікнейми та гривневі суми із наданих власником записів Donatello.
// Лише фрагмент історії (жовтень–листопад 2026), не повний експорт.
// Тестові записи "123" виключені, $T не конвертуємо без курсу.
(()=>{'use strict';
const records=[["MinaTo (Вова)",500],["Котику від Лиса",50],["Sima",50],["CYBER",2000],["CYBER",2000],["Діма",50],["Лис",50],["Лис",50],["Лис",50],["раб Некста",50],["Котику від Лиса",50],["Дядя Босс",50],["Дядя Босс",160],["vareni4ki",100],["SpeedWagon",50],["YouTube NOTACTICC",200],["vareni4ki",100],["YouTube NOTACTICC",100],["Котику від Лиса",150],["Псіна",500],["Псіна",200],["Псіна",100],["Псіна",50],["За кота",50],["Galactus",100],["За пєсню)",50],["Proxima",100],["Centauri",50],["ghost_walker",200],["YouTube NOTACTICC",150],["YouTube NOTACTICC",200],["Wydy",200],["Хто",300],["Proxima",50],["YouTube NOTACTICC",100],["YouTube NOTACTICC",100],["Котику від Лиса",10],["YouTube NOTACTICC",250],["YouTube NOTACTICC",500],["vareni4ki",50],["Котику від Лиса",10],["vareni4ki",100],["YouTube NOTACTICC",50],["SpeedWagon",50],["Legolasik",50],["Legolasik",50],["YouTube NOTACTICC",100],["Centauri",50],["Котику від Лиса",50],["собачка",1000],["Котику від Лиса",20],["Legolasik",666],["YouTube NOTACTICC",100],["Хто",200],["Короп",500]];
const grouped=new Map();
for(const [name,amount] of records){const key=name.trim().toLocaleLowerCase('uk');const old=grouped.get(key)||{name,total:0,count:0};old.total+=amount;old.count++;grouped.set(key,old)}
const donors=[...grouped.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'uk'));
const money=n=>new Intl.NumberFormat('uk-UA').format(n)+' ₴';
function render(where){if(!where)return;const filter=document.createElement('input');filter.type='search';filter.placeholder='Знайти донатера за ніком…';filter.className='donor-search';filter.setAttribute('aria-label','Пошук донатера');
const featured=document.createElement('div');featured.className='donor-podium';
const list=document.createElement('div');list.className='donor-list';where.replaceChildren(filter,featured,list);
function draw(){const q=filter.value.trim().toLocaleLowerCase('uk');const shown=donors.filter(d=>d.name.toLocaleLowerCase('uk').includes(q));
featured.replaceChildren();list.replaceChildren();
if(!q){for(const [i,d] of donors.slice(0,3).entries()){const c=document.createElement('article');c.className='donor-medal';const crown=document.createElement('div');crown.textContent=['👑','🥈','🥉'][i];crown.className='donor-crown';const n=document.createElement('strong');n.textContent=d.name;const amount=document.createElement('b');amount.textContent=money(d.total);c.append(crown,n,amount);featured.append(c)}}
shown.forEach(d=>{const item=document.createElement('div');item.className='donor-item';const name=document.createElement('strong');name.textContent=d.name;const amt=document.createElement('span');amt.textContent=money(d.total)+' · '+d.count+' дон.';item.append(name,amt);list.append(item)});if(!shown.length)list.textContent='Нікого не знайдено.'}
filter.addEventListener('input',draw);draw()}
function renderVillage(){
const root=document.getElementById('donorVillage');if(!root)return;root.replaceChildren();
donors.forEach((d,i)=>{const card=document.createElement('button');card.type='button';card.className='donor-house';
const icon=document.createElement('span');icon.className='house-icon';icon.textContent=['🏰','🏡','🏠','🏘️','🏯'][i%5];
const name=document.createElement('strong');name.textContent=d.name;const amount=document.createElement('small');amount.textContent=money(d.total)+' · '+d.count+' дон.';
card.append(icon,name,amount);card.addEventListener('click',()=>{document.getElementById('donorHouseName').textContent=d.name;document.getElementById('donorHouseDetails').textContent='Будинок №'+(i+1)+' у місті донатерів. '+money(d.total)+' за '+d.count+' донатів із наданого списку. Дякуємо тобі за підтримку!';document.getElementById('donorHouseDialog').showModal()});root.append(card)});
document.getElementById('closeDonorHouse').addEventListener('click',()=>document.getElementById('donorHouseDialog').close());
}
function init(){renderVillage();render(document.getElementById('donorWall'));render(document.getElementById('donorWallMini'));const count=document.getElementById('donorCount');if(count)count.textContent=donors.length}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KIT_DONORS=donors;
})();