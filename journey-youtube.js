/* Drilltroppen — YouTube IFrame API.
   Viser kun 01:45–02:05. Stiller bilde/avspilling etter synlighet
   og beholder et vanlig foto hvis YouTube ikke kan lastes. */
(() => {
  const ytFrames = document.querySelectorAll(".journey-youtube-frame[data-video-id]");
  if (!ytFrames.length) return;

  let apiPromise;
  function loadYouTubeAPI() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YouTube API er ikke tilgjengelig"));
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube kunne ikke lastes"));
      document.head.appendChild(script);
    });
    return apiPromise;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  ytFrames.forEach((frame) => {
    const { videoId } = frame.dataset;
    const start = Number(frame.dataset.start || 105);
    const end = Number(frame.dataset.end || 125);
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId) || !(start >= 0 && end > start)) return;

    const holder = frame.querySelector(".journey-youtube-holder");
    const button = frame.querySelector(".journey-youtube-toggle");
    if (!holder || !button) return;

    let player = null;
    let yt = null;
    let ready = false;
    let initializing = false;
    let inView = false;
    let manuallyPaused = false;
    let manuallyStarted = false;
    let monitor = null;

    function setLabel(playing) {
      button.innerHTML = playing
        ? 'Pause <span aria-hidden="true">Ⅱ</span>'
        : 'Spill av <span aria-hidden="true">▶</span>';
      button.setAttribute("aria-label", playing ? "Pause Drilltroppen-videoen" : "Spill av Drilltroppen-videoen");
    }

    function shouldPlay() {
      return inView && !document.hidden && !manuallyPaused &&
        (!reducedMotion.matches || manuallyStarted);
    }

    function stopMonitor() {
      if (monitor !== null) {
        clearInterval(monitor);
        monitor = null;
      }
    }

    function startMonitor() {
      if (monitor !== null) return;
      monitor = setInterval(() => {
        if (!player || !ready || !shouldPlay()) return;
        const at = player.getCurrentTime();
        if (!Number.isFinite(at)) return;
        // Kontrollerer at YouTube ikke hopper tilbake til begynnelsen.
        if (at < start - 1 || at >= end - 0.15) {
          player.seekTo(start, true);
        }
      }, 250);
    }

    function startSegment() {
      if (!player || !ready || !shouldPlay()) return;
      player.mute();
      // loadVideoById støtter både start- og sluttsekund; brukes også ved løkke.
      player.loadVideoById({ videoId, startSeconds: start, endSeconds: end });
      startMonitor();
      setLabel(true);
    }

    function pause() {
      stopMonitor();
      if (player && ready) player.pauseVideo();
      setLabel(false);
    }

    function showFallback() {
      pause();
      button.hidden = true;
      // Bildet som lå her opprinnelig beholdes ved feilmelding.
      const photo = document.createElement("img");
      photo.src = "assets/garden-platinum-2022.jpg";
      photo.alt = "Drilltroppen under en oppvisning";
      photo.loading = "lazy";
      holder.replaceChildren(photo);
    }

    async function makePlayer() {
      if (player || initializing) return;
      initializing = true;
      try {
        yt = await loadYouTubeAPI();
        if (!shouldPlay()) {
          initializing = false;
          return;
        }
        const target = document.createElement("div");
        holder.replaceChildren(target);
        player = new yt.Player(target, {
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            controls: 0, playsinline: 1, rel: 0, fs: 0,
            start, end, mute: 1, autoplay: 0
          },
          events: {
            onReady: (event) => {
              ready = true;
              event.target.mute();
              if (shouldPlay()) startSegment();
            },
            onStateChange: (event) => {
              if (!yt) return;
              if (event.data === yt.PlayerState.ENDED && shouldPlay()) {
                startSegment();
              } else if (event.data === yt.PlayerState.PLAYING) {
                startMonitor();
              }
            },
            onError: showFallback
          }
        });
      } catch (error) {
        console.warn("Videoen fra Basel Tattoo kunne ikke lastes.", error);
        showFallback();
      } finally {
        initializing = false;
      }
    }

    function updatePlayback() {
      if (!shouldPlay()) {
        pause();
      } else if (!player) {
        void makePlayer();
      } else if (ready) {
        // Gjenopptar alltid fra riktig tidspunkt.
        startSegment();
      }
    }

    button.addEventListener("click", () => {
      if (manuallyPaused || !ready || !shouldPlay()) {
        manuallyPaused = false;
        manuallyStarted = true;
        updatePlayback();
      } else {
        manuallyPaused = true;
        pause();
      }
    });

    const observer = new IntersectionObserver(([entry]) => {
      const nowVisible = entry.isIntersecting;
      if (inView === nowVisible) return;
      inView = nowVisible;
      updatePlayback();
    }, { threshold: 0.25 });

    observer.observe(holder);
    document.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener?.("change", updatePlayback);
    window.addEventListener("pagehide", stopMonitor);
  });
})();
