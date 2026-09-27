"use client";
import { useEffect, useRef } from "react";

const TAU=Math.PI*2;
const colors=["#c49b57","#7c3a51","#286b66","#527795","#b66b43","#44435e","#a4575d","#779474","#d6b681","#714a73","#457c93","#af8555"];
const normalize=(n:number)=>((n%TAU)+TAU)%TAU;
function progress(t:number){
 t=Math.max(0,Math.min(1,t));
 const a=.035,b=.70,d=1-b,total=b-a/2+d/3;
 if(t<a)return(t*t/(2*a))/total;
 if(t<b)return(t-a/2)/total;
 const q=(t-b)/d;return(b-a/2+d*(q-q*q+q*q*q/3))/total;
}

export default function LiveWheel({entries,active,startedAt,clockOffset,winnerIndex}:{entries:string[];active:boolean;startedAt?:number;clockOffset:number;winnerIndex?:number}){
 const canvas=useRef<HTMLCanvasElement>(null),angle=useRef(0),hadActive=useRef(false);
 const key=entries.join("\u0000");
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const ctx=el.getContext("2d");if(!ctx)return;
  const size=800,r=393,n=entries.length;
  ctx.clearRect(0,0,size,size);ctx.save();ctx.translate(size/2,size/2);
  if(!n){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fillStyle="#503142";ctx.fill();ctx.restore();return}
  const arc=TAU/n;
  for(let i=0;i<n;i++){
   const middle=-Math.PI/2+i*arc,start=middle-arc/2;
   ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,start,start+arc);ctx.closePath();
   ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle="#f9dba199";ctx.lineWidth=n>40?1:2;ctx.stroke();
   ctx.save();ctx.rotate(middle);ctx.translate(r*.64,0);ctx.rotate(Math.PI/2);
   let label=entries[i];if(label.length>16)label=label.slice(0,15)+"…";
   let font=Math.max(10,Math.min(31,370/Math.sqrt(n)));
   ctx.font="bold "+font+"px Georgia";const room=2*Math.sin(arc/2)*r*.64*.84;
   if(ctx.measureText(label).width>room)font=Math.max(9,font*room/ctx.measureText(label).width);
   ctx.font="bold "+font+"px Georgia";ctx.fillStyle=i%3===0?"#2e1a25":"#fff1d3";ctx.textAlign="center";ctx.textBaseline="middle";
   ctx.fillText(label,0,0,Math.max(8,room));ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,r-2,0,TAU);ctx.strokeStyle="#f7d394";ctx.lineWidth=8;ctx.stroke();ctx.restore();
 },[key]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  let frame=0;
  const setAngle=(value:number)=>{angle.current=value;el.style.transform="rotate("+value+"rad)"};
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(active&&startedAt){
   hadActive.current=true;
   const tick=()=>{
    const t=Math.max(0,Math.min(1,(Date.now()+clockOffset-startedAt)/60000));
    if(!reduced)setAngle(35*TAU*progress(t));
    if(t<1)frame=requestAnimationFrame(tick);
   };
   tick();
  }else if(entries.length&&winnerIndex!==undefined){
   const target=normalize(-winnerIndex*TAU/entries.length);
   if(hadActive.current&&!reduced){
    hadActive.current=false;
    const from=angle.current,to=from+TAU+normalize(target-normalize(from)),since=performance.now();
    const settle=(time:number)=>{
     const t=Math.min(1,(time-since)/1400),ease=1-Math.pow(1-t,3);
     setAngle(from+(to-from)*ease);
     if(t<1)frame=requestAnimationFrame(settle);
    };
    frame=requestAnimationFrame(settle);
   }else setAngle(target);
  }else if(!active)setAngle(0);
  return()=>cancelAnimationFrame(frame);
 },[active,startedAt,clockOffset,key,winnerIndex,entries.length]);
 return <div className="spectator-wheel" role="img" aria-label={active?`Барабан обертається. Учасників: ${entries.length}`:winnerIndex!==undefined?`Барабан зупинився на ${entries[winnerIndex]}`:`Барабан із ${entries.length} учасниками`}>
  <div className="wheel-lamps" aria-hidden="true"><canvas ref={canvas} width={800} height={800}/><span className="wheel-hub">✦<small>ПОЛЕ<br/>ЧУДЕС</small></span></div>
  <div className="wheel-pointer" aria-hidden="true" />
 </div>;
}
