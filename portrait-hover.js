/* Portrait interaction: hover/focus in CSS, tap and keyboard fallback in JS. */
(() => {
  "use strict";
  const portrait = document.querySelector(".studio-home .studio-hero-portrait");
  if (!portrait) return;

  const wink = portrait.querySelector(".studio-eye-wink");
  const winkOnce = () => {
    if (!wink || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    portrait.classList.remove("is-winking");
    void wink.offsetWidth;
    portrait.classList.add("is-winking");
  };
  if (wink) wink.addEventListener("animationend", () => portrait.classList.remove("is-winking"));
  portrait.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") winkOnce();
  });
  portrait.addEventListener("focus", winkOnce);
  const setOpen = (open) => {
    portrait.classList.toggle("is-active", open);
    portrait.setAttribute("aria-expanded", String(open));
    if (open) winkOnce();
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
