/* Portrait interaction: hover/focus in CSS, tap and keyboard fallback in JS. */
(() => {
  "use strict";
  const portrait = document.querySelector(".studio-home .studio-hero-portrait");
  if (!portrait) return;

  const setOpen = (open) => {
    portrait.classList.toggle("is-active", open);
    portrait.setAttribute("aria-expanded", String(open));
  };
  portrait.addEventListener("click", () => {
    setOpen(!portrait.classList.contains("is-active"));
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
