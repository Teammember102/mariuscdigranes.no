/* Portrait interaction: hover/focus in CSS, tap and keyboard fallback in JS. */
(() => {
  "use strict";
  const portrait = document.querySelector(".studio-home .studio-hero-portrait");
  if (!portrait) return;

  const sparkle = portrait.querySelector(".studio-eye-sparkle");
  const sparkleOnce = () => {
    if (!sparkle || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    portrait.classList.remove("is-sparkling");
    void sparkle.offsetWidth;
    portrait.classList.add("is-sparkling");
  };
  if (sparkle) sparkle.addEventListener("animationend", () => portrait.classList.remove("is-sparkling"));
  portrait.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") sparkleOnce();
  });
  portrait.addEventListener("focus", sparkleOnce);
  const setOpen = (open) => {
    portrait.classList.toggle("is-active", open);
    portrait.setAttribute("aria-expanded", String(open));
    if (open) sparkleOnce();
  };
  portrait.addEventListener("click", () => {
    // Only taps should toggle; on desktop the label is a pure hover effect.
    if (window.matchMedia("(hover: none)").matches) {
      setOpen(!portrait.classList.contains("is-active"));
    }
  });
  portrait.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(!portrait.classList.contains("is-active"));
    } else if (event.key === "Escape") {
      setOpen(false);
      portrait.blur();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!portrait.contains(event.target)) setOpen(false);
  });
})();
