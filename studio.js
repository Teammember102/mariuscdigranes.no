/* Original scroll choreography, no external dependencies. */
(() => {
  "use strict";
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;

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
  // A thin reading-progress underline, restricted to the homepage.
  if(document.body.classList.contains("studio-home")) {
    const line=document.createElement("span");
    line.className="studio-reading-progress";
    line.setAttribute("aria-hidden","true");
    Object.assign(line.style,{
      position:"fixed",top:"0",left:"0",height:"3px",width:"100%",
      transformOrigin:"left center",transform:"scaleX(0)",
      background:"#F6D76B",zIndex:"50",pointerEvents:"none"
    });
    document.body.append(line);
    let scheduled=false;
    const measure=()=>{
      scheduled=false;
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      line.style.transform="scaleX("+Math.min(1,Math.max(0,scrollY/max))+")";
    };
    const onScroll=()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(measure);
    };
    addEventListener("scroll",onScroll,{passive:true});
    addEventListener("resize",onScroll,{passive:true});
    measure();
  }
})();
