/* Original scroll choreography, no external dependencies. */
(() => {
  "use strict";
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!reduced.matches) {

  // Animate only content that is about to enter the viewport.
  const revealEls=[
    ...document.querySelectorAll(".studio-reveal"),
    ...document.querySelectorAll(".project-intro, .project-shot, .cv-block, .contact-opening, .contact-socials, .journey-event .journey-copy, .gallery-grid figure")
  ];
  if ("IntersectionObserver" in window) {
    const io=new IntersectionObserver((entries,observer)=>{
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("studio-visible");
        observer.unobserve(entry.target);
      }
    },{threshold:0.07,rootMargin:"0px 0px -18px 0px"});
    for(const el of revealEls) {
      // "studio-before" only after CSS/JS have successfully loaded.
      el.classList.add("studio-reveal","studio-before");
      io.observe(el);
    }
    // Keep late-loading content visible if it never receives a scroll event.
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="visible") {
        for(const el of revealEls) {
          if(el.getBoundingClientRect().top<window.innerHeight+20)el.classList.add("studio-visible");
        }
      }
    });
  }
  }

  // The top reading-progress line now has a small runner at its leading edge.
  // It follows scroll position, with running movement only while the user scrolls.
  if (document.body.classList.contains("studio-home")) {
    const wrap = document.createElement("div");
    wrap.className = "studio-reading-progress-wrap";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <span class="studio-reading-progress-line"></span>
      <span class="studio-reading-progress-runner">
        <svg viewBox="0 0 54 58" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <g class="runner-bounce" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <!-- Side view facing right. The far arm drives forward as the near knee rises. -->
            <g class="runner-arm runner-arm--back" opacity=".68">
              <path d="M23 20.5 L25 31 L34 25"/>
            </g>
            <g class="runner-leg runner-leg--back" opacity=".75">
              <path d="M20.5 32.5 L20.5 45.5 L25.5 52 L29 52"/>
            </g>
            <path d="M24 16 L20.5 32.5"/>
            <circle cx="26" cy="8.5" r="5.6"/>
            <g class="runner-leg runner-leg--front">
              <path d="M20.5 32.5 L20.5 45.5 L25.5 52 L29 52"/>
            </g>
            <g class="runner-arm runner-arm--front">
              <path d="M23 20.5 L25 31 L34 25"/>
            </g>
          </g>
        </svg>
      </span>
    `;
    document.body.append(wrap);

    const line = wrap.querySelector(".studio-reading-progress-line");
    const runner = wrap.querySelector(".studio-reading-progress-runner");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scheduled = false;
    let stopTimer = null;
    let previousY = window.scrollY;

    const measure = () => {
      scheduled = false;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const fraction = Math.min(1, Math.max(0, window.scrollY / max));
      const viewportWidth = document.documentElement.clientWidth;
      const runnerWidth = runner.getBoundingClientRect().width || 38;
      const x = Math.min(viewportWidth - runnerWidth, Math.max(0, fraction * viewportWidth - runnerWidth / 2));

      line.style.transform = "scaleX(" + fraction + ")";
      runner.style.transform = "translate3d(" + x + "px,0,0)";

      if (!reducedMotion.matches && Math.abs(window.scrollY - previousY) > 0.5) {
        wrap.classList.add("is-scrolling");
        clearTimeout(stopTimer);
        stopTimer = setTimeout(() => wrap.classList.remove("is-scrolling"), 180);
      }
      previousY = window.scrollY;
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, {passive: true});
    window.addEventListener("resize", onScroll, {passive: true});
    measure();
  }
})();
