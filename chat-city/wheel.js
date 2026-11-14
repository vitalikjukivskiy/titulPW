(()=>{
const c=document.getElementById('kitWheel');if(!c)return;const ctx=c.getContext('2d'),btn=document.getElementById('kitSpin'),out=document.getElementById('kitOutcome'),link=document.getElementById('kitOutcomeAction');
const items=[
['YouTube','▶','https://www.youtube.com/@Vitalik_Juk','#e43f4f'],
['TikTok','♫','https://www.tiktok.com/@kit_myhaylo','#293b51'],
['Twitch','◉','https://www.twitch.tv/selo_game','#8354d5'],
['Telegram','✈','', '#25a8d4'],
['Instagram','◎','', '#d54c94'],
['Discord','☷','', '#6676c9'],
['Рефералка','🔗','https://cabinet.cyberpw.fun/register.php?ref=4550','#15a6a2'],
['Donatello','♥','https://donatello.to/general_yogik','#ec8d3d'],
['Місто донатерів','⌂','#donorCity','#a94cc5'],
['Донат на місто','★','https://donatello.to/general_yogik','#4f9f56']
];const n=items.length,segment=2*Math.PI/n;let angle=0,active=false;
ctx.translate(450,450);
items.forEach(([label,icon,,color],i)=>{const a=-Math.PI/2+i*segment,mid=a+segment/2;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,437,a,a+segment);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#ffe7a6';ctx.stroke();ctx.save();ctx.rotate(mid);ctx.translate(286,0);ctx.rotate(Math.PI/2);ctx.textAlign='center';ctx.fillStyle='white';ctx.shadowColor='#111';ctx.shadowBlur=8;ctx.font='bold 42px system-ui';ctx.fillText(icon,0,-15);ctx.font='bold 23px system-ui';const lines=label==='Місто донатерів'?['Місто','донатерів']:label==='Донат на місто'?['Донат','на місто']:[label];lines.forEach((line,j)=>ctx.fillText(line,0,20+j*27));ctx.restore()});
ctx.beginPath();ctx.arc(0,0,60,0,Math.PI*2);ctx.fillStyle='#ffe2a0';ctx.fill();ctx.lineWidth=9;ctx.strokeStyle='#ac7333';ctx.stroke();
function roll(max){const v=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(v)}while(v[0]>=limit);return v[0]%max}
btn.addEventListener('click',()=>{if(active)return;active=true;btn.disabled=true;link.replaceChildren();out.textContent='🧚 Топчик летить! Кожному сектору по 10%.';
const winner=roll(n),target=(360-(winner+.5)*360/n+360)%360,current=((angle%360)+360)%360,delta=(target-current+360)%360,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?800:6400;angle+=(reduced?360:2160+360*roll(3))+delta;c.style.transition='transform '+duration+'ms cubic-bezier(.12,.78,.09,1)';c.style.transform='rotate('+angle+'deg)';
setTimeout(()=>{const [name,,url]=items[winner];active=false;btn.disabled=false;out.textContent='🎉 Випало: '+name+'!';if(url){const a=document.createElement('a');a.href=url;a.className='kit-action';a.textContent=url.startsWith('#')?'Відвідати місто ↘':'Перейти: '+name+' ↗';if(!url.startsWith('#')){a.target='_blank';a.rel='noopener noreferrer'}link.append(a)}else{out.textContent+=' Посилання ще не підтверджене.'}},duration+70)})})();