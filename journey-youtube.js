/* YouTube-innslag fra Basel Tattoo (1:45–2:05).
   Laster spilleren når den er synlig, og forsøker å pause utenfor synsfeltet. */
(() => {
  const frames = document.querySelectorAll(".journey-youtube-frame[data-video-id]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  frames.forEach((frame) => {
    const {videoId, start, end} = frame.dataset;
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;
    const holder = frame.querySelector(".journey-youtube-holder");
    const button = frame.querySelector(".journey-youtube-toggle");
    let player = null, inView = false, manualPause = false, manuallyStarted = false;

    function label(isPlaying) {
      button.innerHTML = isPlaying ? 'Pause <span aria-hidden="true">Ⅱ</span>' : 'Spill av <span aria-hidden="true">▶</span>';
      button.setAttribute("aria-label", isPlaying ? "Pause Drilltroppen-videoen" : "Spill av Drilltroppen-videoen");
    }
    function command(name) {
      if (!player?.contentWindow) return;
      player.contentWindow.postMessage(JSON.stringify({event:"command",func:name,args:[]}),"https://www.youtube-nocookie.com");
    }
    function createPlayer(auto) {
      if (player) return;
      const url=new URL("https://www.youtube-nocookie.com/embed/"+videoId);
      url.searchParams.set("start",start||"105");
      url.searchParams.set("end",end||"125");
      url.searchParams.set("autoplay",auto?"1":"0");
      url.searchParams.set("mute","1");
      url.searchParams.set("loop","1");
      url.searchParams.set("playlist",videoId);
      url.searchParams.set("playsinline","1");
      url.searchParams.set("controls","0");
      url.searchParams.set("rel","0");
      url.searchParams.set("enablejsapi","1");
      if (/^https?:$/.test(location.protocol)) url.searchParams.set("origin",location.origin);
      player=document.createElement("iframe");
      player.title="Drilltroppen på Basel Tattoo 2022, fra 1 minutt og 45 sekunder til 2 minutter og 5 sekunder";
      player.src=url.toString();
      player.allow="autoplay; encrypted-media; picture-in-picture";
      player.referrerPolicy="strict-origin-when-cross-origin";
      player.loading="lazy";
      holder.replaceChildren(player);
    }
    function shouldPlay() {
      return inView && !document.hidden && !manualPause && (!reduceMotion.matches || manuallyStarted);
    }
    function update() {
      if (shouldPlay()) {
        if (!player) createPlayer(true);
        else command("playVideo");
        label(true);
      } else {
        command("pauseVideo");
        label(false);
      }
    }
    button.addEventListener("click", () => {
      if (manualPause || !player || !shouldPlay()) {
        manualPause=false;
        manuallyStarted=true;
        if (!player) createPlayer(true);
        else command("playVideo");
        label(true);
      } else {
        manualPause=true;
        command("pauseVideo");
        label(false);
      }
    });
    const observer=new IntersectionObserver(([entry])=>{
      inView=entry.isIntersecting;
      update();
    },{threshold:0.25});
    observer.observe(holder);
    document.addEventListener("visibilitychange",update);
    reduceMotion.addEventListener?.("change",update);
  });
})();
