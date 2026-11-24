/* Lokal, båndbreddevennlig videoavspilling i Min reise.
   MP4-en er delt i mindre statiske filer for publisering. Delene settes sammen
   byte-for-byte i nettleseren, og kun når videoen kommer til syne. */
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const frames = document.querySelectorAll(".journey-video-frame[data-parts]");

  frames.forEach((frame) => {
    const video = frame.querySelector("video");
    const button = frame.querySelector(".journey-video-hitarea");
    const parts = frame.dataset.parts.split(",").map(s => s.trim()).filter(Boolean);
    let inView = false;
    let manuallyPaused = false;
    let manuallyStarted = false;
    let videoURL = null;
    let loading = null;

    function setLabel(isPlaying) {
      button.setAttribute("aria-label", isPlaying ? "Pause Norske Talenter-videoen" : "Spill av Norske Talenter-videoen");
    }

    async function ensureLoaded() {
      if (loading) return loading;
      loading = Promise.all(parts.map(async (part) => {
        const response = await fetch(part);
        if (!response.ok) throw new Error("Video kunne ikke lastes");
        return response.arrayBuffer();
      })).then((buffers) => {
        videoURL = URL.createObjectURL(new Blob(buffers, { type: "video/mp4" }));
        video.src = videoURL;
        video.load();
        return true;
      }).catch((error) => {
        console.warn("Videoklippet er utilgjengelig. Viser stillbildet.", error);
        frame.classList.add("video-unavailable");
        button.disabled = true;
        button.setAttribute("aria-label", "Norske Talenter-videoen er ikke tilgjengelig");
        return false;
      });
      return loading;
    }

    async function maybePlay() {
      if (document.hidden || !inView || manuallyPaused || (reducedMotion.matches && !manuallyStarted)) {
        video.pause();
        setLabel(false);
        return;
      }
      if (!(await ensureLoaded())) return;
      if (document.hidden || !inView || manuallyPaused || (reducedMotion.matches && !manuallyStarted)) return;
      try {
        await video.play();
        setLabel(true);
      } catch (_) {
        setLabel(false);
      }
    }

    button.addEventListener("click", () => {
      if (!video.paused) {
        manuallyPaused = true;
        video.pause();
        setLabel(false);
      } else {
        manuallyPaused = false;
        manuallyStarted = true;
        void maybePlay();
      }
    });

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) void maybePlay();
      else {
        video.pause();
        setLabel(false);
      }
    }, { threshold: 0.2 });
    observer.observe(frame);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        video.pause();
        setLabel(false);
      } else if (inView) {
        void maybePlay();
      }
    });
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches && !manuallyStarted) {
        video.pause();
        setLabel(false);
      } else if (inView) {
        void maybePlay();
      }
    });

    window.addEventListener("pagehide", () => {
      if (videoURL) URL.revokeObjectURL(videoURL);
    });
  });
})();
