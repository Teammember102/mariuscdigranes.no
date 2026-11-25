/* Bergen time-by-time forecast: same-origin JSON from an hourly MET Norway cache.
   GitHub Actions supplies an identified User-Agent and honours MET cache policy.
   Original pictograms are drawn locally; no third-party weather widget. */
(() => {
  "use strict";
  const viewport=document.getElementById("bergen-weather-viewport");
  const track=document.getElementById("bergen-weather-track");
  const status=document.getElementById("bergen-weather-status");
  if(!viewport||!track||!status)return;

  // Four decimal coordinates per MET's caching requirements.
  const API="data/bergen-weather.json";
  const KEY="bergen-hourly-site-cache-v2";
  const TZ="Europe/Oslo";
  const HOUR=3600000;
  const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const fmtHour=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,hour:"2-digit",hourCycle:"h23"});
  const fmtDate=new Intl.DateTimeFormat("sv-SE",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"});
  const fmtWeekday=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,weekday:"short"});
  const fmtUpdate=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,hour:"2-digit",minute:"2-digit"});
  const fmtRain=new Intl.NumberFormat("nb-NO",{maximumFractionDigits:1});
  const SUN='<circle class="weather-sun" cx="35" cy="21" r="9"/><path class="weather-outline" d="M35 4v5 M35 33v5 M18 21h5 M47 21h5 M23 9l4 4 M43 29l4 4 M47 9l-4 4 M27 29l-4 4"/>';
  const MOON='<path class="weather-cloud" d="M42 8a18 18 0 1 0 15 29A18 18 0 0 1 42 8z"/>';
  const CLOUD='<path class="weather-cloud" d="M16 45h30c7 0 10-5 10-10s-4-9-9-10c-3-9-15-12-22-5-2 2-4 5-4 8-7-2-15 4-15 10s5 7 10 7z"/>';
  const SMALL_CLOUD='<path class="weather-cloud" d="M13 38h30c6 0 9-4 9-9s-4-8-8-8c-3-7-14-9-20-3-2 2-3 4-3 6-6-1-12 4-12 9s1 5 4 5z"/>';
  const RAIN='<path class="weather-outline" d="M18 49l-3 8 M32 49l-3 8 M46 49l-3 8"/>';
  const SNOW='<path class="weather-outline" d="M16 52h8 M20 48v8 M36 52h8 M40 48v8"/>';
  const THUNDER='<path class="weather-bolt" d="M33 45l-9 11h9l-4 9 17-15h-9l5-5z"/>';
  const FOG='<path class="weather-outline" d="M9 46h47 M15 53h36 M9 59h30"/>';
  let widthOfSet=0;
  let lastFrame=0;
  let pauseUntil=0;
  let hovered=false;
  let focused=false;
  let pointerActive=false;
  let busy=false;

  function iconAndLabel(raw){
    const code=String(raw||"cloudy").toLowerCase();
    const night=code.includes("_night")||code.includes("polartwilight");
    const svg=(contents)=>'<svg viewBox="0 0 64 68" aria-hidden="true" focusable="false">'+contents+'</svg>';
    if(code.includes("thunder"))return {label:"Torden",svg:svg(CLOUD+THUNDER)};
    if(code.includes("sleet"))return {label:"Sludd",svg:svg(CLOUD+RAIN+SNOW)};
    if(code.includes("snow"))return {label:"Snø",svg:svg(CLOUD+SNOW)};
    if(code.includes("rain")||code.includes("drizzle"))return {label:"Regn",svg:svg(CLOUD+RAIN)};
    if(code.includes("fog"))return {label:"Tåke",svg:svg(SMALL_CLOUD+FOG)};
    if(code.includes("partlycloudy")||code.includes("fair"))return {label:"Delvis skyet",svg:svg((night?MOON:SUN)+CLOUD)};
    if(code.includes("cloudy"))return {label:"Skyet",svg:svg(CLOUD)};
    if(code.includes("clearsky"))return {label:night?"Klart":"Sol",svg:svg(night?MOON:SUN)};
    return {label:"Skyet",svg:svg(CLOUD)};
  }
  function dayLabel(date){
    const now=new Date();
    const today=fmtDate.format(now);
    const day=fmtDate.format(date);
    if(today===day)return "I DAG";
    const tomorrow=fmtDate.format(new Date(now.getTime()+HOUR*24));
    if(day===tomorrow)return "I MORGEN";
    return fmtWeekday.format(date).toUpperCase().replace(".","");
  }
  function getCache(){
    try{
      const obj=JSON.parse(localStorage.getItem(KEY)||"null");
      return obj&&Array.isArray(obj.hours)&&Number.isFinite(obj.expires)?obj:null;
    }catch(_){return null;}
  }
  function putCache(obj){
    try{localStorage.setItem(KEY,JSON.stringify(obj));}catch(_){}
  }
  function parseForecast(data){
    const entries=data?.hours;
    if(!Array.isArray(entries))throw new Error("Ukjent respons fra værdatakilden");
    const earliest=Date.now()-HOUR;
    const hours=entries.filter(entry=>{
      const stamp=Date.parse(entry?.time);
      return Number.isFinite(stamp)&&stamp>=earliest;
    }).slice(0,24).map(entry=>({
      time:entry.time,
      temperature:Number(entry.temperature),
      rain:Number(entry.rain??0),
      symbol:String(entry.symbol||"cloudy")
    })).filter(entry=>Number.isFinite(entry.temperature)&&Number.isFinite(entry.rain));
    if(hours.length<8)throw new Error("For få timesvarsel");
    return hours;
  }
  function createHour(row,index){
    const date=new Date(row.time);
    const weather=iconAndLabel(row.symbol);
    const hour=document.createElement("article");
    hour.className="bergen-weather-hour"+(index===0?" is-current":"");
    hour.setAttribute("aria-label",dayLabel(date)+" klokken "+fmtHour.format(date)+": "+weather.label+", "+Math.round(row.temperature)+" grader, "+fmtRain.format(Math.max(0,row.rain))+" millimeter nedbør");
    const top=document.createElement("div");top.className="bergen-weather-hour-top";
    const day=document.createElement("span");day.className="bergen-weather-day";day.textContent=dayLabel(date);
    const time=document.createElement("span");time.className="bergen-weather-time";time.textContent=index===0?"NÅ":fmtHour.format(date);
    top.append(day,time);
    const pict=document.createElement("span");pict.className="bergen-weather-symbol";pict.innerHTML=weather.svg;
    const temperature=document.createElement("strong");temperature.className="bergen-weather-temp";temperature.textContent=Math.round(row.temperature)+"°";
    const bottom=document.createElement("div");bottom.className="bergen-weather-bottom";
    const rain=document.createElement("span");rain.className="bergen-weather-rain";rain.textContent="↘ "+fmtRain.format(Math.max(0,row.rain))+" mm";
    const condition=document.createElement("span");condition.className="bergen-weather-description";condition.textContent=weather.label;
    bottom.append(rain,condition);hour.append(top,pict,temperature,bottom);
    return hour;
  }
  function render(hours,updatedAt,stale){
    const upcoming=hours.filter(row=>Date.parse(row.time)>=Date.now()-HOUR).slice(0,24);
    if(!upcoming.length)throw new Error("Varslet er utløpt");
    const group=document.createElement("div");group.className="bergen-weather-group";
    upcoming.forEach((row,index)=>group.append(createHour(row,index)));
    const duplicate=group.cloneNode(true);
    duplicate.setAttribute("aria-hidden","true");
    duplicate.querySelectorAll("[aria-label]").forEach(el=>el.removeAttribute("aria-label"));
    track.replaceChildren(group,duplicate);
    viewport.scrollLeft=0;
    widthOfSet=group.getBoundingClientRect().width;
    status.textContent=(stale?"ELDRE VARSEL · ":"OPPDATERT ")+fmtUpdate.format(new Date(updatedAt));
  }
  function showFailure(){
    status.textContent="VARSEL IKKE TILGJENGELIG";
    const paragraph=document.createElement("p");
    paragraph.className="bergen-weather-error";
    paragraph.textContent="Klarte ikke å hente været akkurat nå. ";
    const link=document.createElement("a");
    link.href="https://www.yr.no/";
    link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="Se værmeldingen på Yr ↗";
    paragraph.append(link);
    track.replaceChildren(paragraph);
  }
  async function update(){
    if(busy)return;
    const cached=getCache();
    if(cached&&cached.expires>Date.now()&&cached.hours.length){
      try{render(cached.hours,cached.updatedAt,false);return;}catch(_){}
    }
    busy=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(API,{cache:"no-cache",credentials:"same-origin",signal:controller.signal});
      if(!response.ok)throw new Error("Værfil "+response.status);
      const payload=await response.json();
      const hours=parseForecast(payload);
      const now=Date.now();
      const updatedAt=Date.parse(payload.updatedAt)||now;
      const expires=now+15*60000; // Cache locally; the hourly GitHub Action updates our same-origin JSON.
      putCache({hours,updatedAt,expires});
      render(hours,updatedAt,now-updatedAt>3*HOUR);
    }catch(err){
      if(cached&&cached.hours?.length){
        try{render(cached.hours,cached.updatedAt,true);return;}catch(_){}
      }
      showFailure();
    }finally{
      clearTimeout(timeout);
      busy=false;
    }
  }
  function pauseForInteraction(){
    pauseUntil=performance.now()+6500;
  }
  function slide(direction){
    if(!widthOfSet)return;
    pauseForInteraction();
    viewport.scrollBy({left:direction*Math.min(viewport.clientWidth*.78,520),behavior:prefersReduced.matches?"instant":"smooth"});
  }
  document.querySelector("[data-weather-prev]")?.addEventListener("click",()=>slide(-1));
  document.querySelector("[data-weather-next]")?.addEventListener("click",()=>slide(1));
  viewport.addEventListener("mouseenter",()=>{hovered=true;});
  viewport.addEventListener("mouseleave",()=>{hovered=false;pauseForInteraction();});
  viewport.addEventListener("focusin",()=>{focused=true;});
  viewport.addEventListener("focusout",()=>{focused=false;pauseForInteraction();});
  viewport.addEventListener("pointerdown",()=>{pointerActive=true;});
  window.addEventListener("pointerup",()=>{if(pointerActive){pointerActive=false;pauseForInteraction();}});
  viewport.addEventListener("wheel",pauseForInteraction,{passive:true});
  viewport.addEventListener("touchend",pauseForInteraction,{passive:true});
  function animate(timestamp){
    const elapsed=Math.min(60,timestamp-(lastFrame||timestamp));
    lastFrame=timestamp;
    if(widthOfSet&&!document.hidden&&!prefersReduced.matches&&!hovered&&!focused&&!pointerActive&&timestamp>pauseUntil){
      viewport.scrollLeft+=elapsed*.045;
      if(viewport.scrollLeft>=widthOfSet)viewport.scrollLeft-=widthOfSet;
    }
    requestAnimationFrame(animate);
  }
  if(!prefersReduced.matches)requestAnimationFrame(animate);
  // Re-check after long-lived sessions without hammering MET's API.
  setInterval(()=>{if(!document.hidden)update();},15*60000);
  update();
})();
