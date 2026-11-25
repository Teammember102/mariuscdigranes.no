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
  // A fresh fallback when the GitHub Pages CDN is still serving an older deploy.
  // This is the same file from the public repository, not an extra MET request.
  const SOURCE_BACKUP="https://raw.githubusercontent.com/Teammember102/mariuscdigranes.no/main/data/bergen-weather.json";
  const KEY="bergen-hourly-site-cache-v3";
  const TZ="Europe/Oslo";
  const HOUR=3600000;
  const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const fmtHour=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,hour:"2-digit",hourCycle:"h23"});
  const fmtDate=new Intl.DateTimeFormat("sv-SE",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"});
  const fmtWeekday=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,weekday:"short"});
  const fmtUpdate=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  const fmtUpdateDate=new Intl.DateTimeFormat("nb-NO",{timeZone:TZ,day:"2-digit",month:"2-digit"});
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
    // Show the actual time the site last retrieved weather data, not page-load time.
    // A previous-day label includes its date so an old clock time is never misleading.
    const stamp=new Date(updatedAt);
    if(!Number.isFinite(stamp.getTime()))throw new Error("Ukjent oppdateringstid");
    const dateLabel=fmtDate.format(stamp)===fmtDate.format(new Date())?"":fmtUpdateDate.format(stamp)+" ";
    status.textContent=(stale?"ELDRE VARSEL · ":"OPPDATERT ")+dateLabel+fmtUpdate.format(stamp);
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
  async function readSnapshot(url,signal){
    // no-store plus a short cache buster prevents the browser/CDN returning
    // yesterday's JSON under an otherwise correct "OPPDATERT" label.
    const separator=url.includes("?")?"&":"?";
    const response=await fetch(url+separator+"weather_ver="+Math.floor(Date.now()/300000),{
      cache:"no-store",credentials:url===API?"same-origin":"omit",signal
    });
    if(!response.ok)throw new Error("Værdata "+response.status);
    const payload=await response.json();
    const updatedAt=Date.parse(payload.updatedAt);
    if(!Number.isFinite(updatedAt))throw new Error("Værdata mangler oppdateringstid");
    const hours=parseForecast(payload);
    return {hours,updatedAt};
  }
  async function update(){
    if(busy)return;
    const cached=getCache();
    if(cached&&cached.hours.length){
      // Display cached weather while the latest snapshot loads, then replace it.
      try{render(cached.hours,cached.updatedAt,Date.now()-cached.updatedAt>3*HOUR);}catch(_){}
    }
    busy=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      let snapshot;
      try {
        snapshot=await readSnapshot(API,controller.signal);
      } catch(_) {
        snapshot=await readSnapshot(SOURCE_BACKUP,controller.signal);
      }
      // Pages may lag behind the GitHub repository by one or more deployments.
      if(Date.now()-snapshot.updatedAt>90*60000){
        try{
          const latest=await readSnapshot(SOURCE_BACKUP,controller.signal);
          if(latest.updatedAt>snapshot.updatedAt)snapshot=latest;
        }catch(_){}
      }
      if(cached&&cached.updatedAt>snapshot.updatedAt){
        try{
          if(cached.hours.filter(row=>Date.parse(row.time)>=Date.now()-HOUR).length>=8){
            snapshot={hours:cached.hours,updatedAt:cached.updatedAt};
          }
        }catch(_){}
      }
      putCache({...snapshot,expires:Date.now()+5*60000});
      render(snapshot.hours,snapshot.updatedAt,Date.now()-snapshot.updatedAt>3*HOUR);
    }catch(_){
      if(!cached||!cached.hours.length)showFailure();
      else{
        try{render(cached.hours,cached.updatedAt,true);}catch(_){showFailure();}
      }
    }finally{
      clearTimeout(timeout);
      busy=false;
    }
  }
  function pauseForInteraction(){
    pauseUntil=performance.now()+6500;
  }
  viewport.addEventListener("mouseenter",()=>{hovered=true;});
  viewport.addEventListener("mouseleave",()=>{hovered=false;pauseUntil=0;focused=viewport.matches(":focus-visible");});
  viewport.addEventListener("focusin",()=>{focused=viewport.matches(":focus-visible");});
  viewport.addEventListener("focusout",()=>{focused=false;pauseForInteraction();});
  viewport.addEventListener("pointerdown",()=>{pointerActive=true;});
  window.addEventListener("pointerup",()=>{if(pointerActive){pointerActive=false;pauseForInteraction();}});
  viewport.addEventListener("wheel",pauseForInteraction,{passive:true});
  viewport.addEventListener("touchend",pauseForInteraction,{passive:true});
  window.addEventListener("pointercancel",()=>{pointerActive=false;pauseUntil=0;});
  function animate(timestamp){
    const elapsed=Math.min(60,timestamp-(lastFrame||timestamp));
    lastFrame=timestamp;
    if(widthOfSet&&!document.hidden&&!prefersReduced.matches&&!hovered&&!focused&&!pointerActive&&timestamp>pauseUntil){
      viewport.scrollLeft+=elapsed*.085;
      if(viewport.scrollLeft>=widthOfSet)viewport.scrollLeft-=widthOfSet;
    }
    requestAnimationFrame(animate);
  }
  if(!prefersReduced.matches)requestAnimationFrame(animate);
  // Re-check after long-lived sessions without hammering MET's API.
  setInterval(()=>{if(!document.hidden)update();},5*60000);
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden)update();
  });
  update();
})();
