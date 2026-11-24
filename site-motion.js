/* Delte, lette portefølje-effekter — ingen nettverk eller bibliotek. */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;

  const rainLayer = document.querySelector(".bergen-rain");
  if (rainLayer) {
    const rain = document.createDocumentFragment();
    const count = Math.min(46, Math.max(25, Math.round(window.innerWidth / 33)));
    const noise = (n) => {
      const s = Math.sin(n * 83.419 + 7.131) * 43758.5453;
      return s - Math.floor(s);
    };
    for (let i = 0; i < count; i++) {
      const drop = document.createElement("span");
      drop.className = "bergen-drop";
      drop.style.setProperty("--x", (4 + 94 * noise(i + 1)).toFixed(2) + "%");
      drop.style.setProperty("--length", (20 + 36 * noise(i + 71)).toFixed(0) + "px");
      drop.style.setProperty("--alpha", (.25 + .55 * noise(i + 130)).toFixed(2));
      drop.style.setProperty("--duration", (1.75 + 2.3 * noise(i + 220)).toFixed(2) + "s");
      drop.style.setProperty("--delay", (-4.3 * noise(i + 320)).toFixed(2) + "s");
      rain.appendChild(drop);
    }
    rainLayer.appendChild(rain);
  }

  const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)");
  if (finePointer.matches) {
    let last = 0;
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || document.hidden) return;
      const time = performance.now();
      if (time - last < 43) return;
      last = time;
      const ring = document.createElement("span");
      ring.className = "cursor-echo";
      const target = event.target;
      if (target instanceof Element &&
          target.closest(".home-page .site-header, .home-page .hero-bergen")) {
        ring.classList.add("cursor-echo--light");
      }
      ring.style.left = event.clientX + "px";
      ring.style.top = event.clientY + "px";
      ring.addEventListener("animationend", () => ring.remove(), { once:true });
      document.body.appendChild(ring);
    }, { passive:true });
  }

  if ("IntersectionObserver" in window) {
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-show");
        io.unobserve(entry.target);
      });
    }, { threshold:.12, rootMargin:"0px 0px -28px 0px" });
    elements.forEach((el) => {
      el.classList.add("reveal-prep");
      observer.observe(el);
    });
  }
})();
