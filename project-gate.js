/* Temporary preview gate for portfolio projects.
   This browser-only code is for convenience, NOT secure access control:
   GitHub Pages HTML remains public and visible in source. */
(() => {
  "use strict";
  const projectFiles = Object.freeze({
    "snapseek.html": "SnapSeek",
    "skredvett.html": "Skredvett",
    "jobbportalen.html": "Jobbportalen"
  });
  const projectKeys = Object.freeze({
    snapseek: "SnapSeek",
    skredvett: "Skredvett",
    jobbportalen: "Jobbportalen"
  });
  const ACCESS_KEY = "meg-portfolio-preview-2026";
  const PREVIEW_CODE = "MEG2027";
  const unlocked = () => {
    try { return sessionStorage.getItem(ACCESS_KEY) === "yes"; }
    catch (_) { return false; }
  };
  const links = [...document.querySelectorAll("a[href]")].filter((link) => {
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin &&
      Object.hasOwn(projectFiles, url.pathname.split("/").pop().toLowerCase());
  });
  const params = new URLSearchParams(location.search);
  const requested = params.get("kommer-snart");
  if (!links.length && !requested) return;

  const dialog = document.createElement("dialog");
  dialog.className = "project-coming-soon";
  dialog.setAttribute("aria-labelledby", "project-coming-soon-title");
  dialog.innerHTML = [
    '<div class="project-coming-soon-inner">',
    '<span class="project-coming-soon-label">UNDER ARBEID / ✳</span>',
    '<h2 id="project-coming-soon-title">Kommer<br><em>snart.</em></h2>',
    '<p id="project-coming-soon-text"><strong class="project-coming-soon-name"></strong> er ikke helt klar for besøk ennå. Jeg finpusser prosjektet og deler mer her snart!</p>',
    '<form class="project-preview-form">',
    '<label for="project-preview-code">Forhåndsvisning med kode</label>',
    '<div class="project-preview-input-row"><input id="project-preview-code" type="password" placeholder="Skriv inn kode" autocomplete="off" spellcheck="false" required>',
    '<button type="submit">Åpne ↗</button></div>',
    '<p class="project-preview-error" role="alert" hidden>Feil kode. Prøv igjen.</p>',
    '</form>',
    '<button class="project-coming-soon-close" type="button">Tilbake til prosjektene <span aria-hidden="true">↗</span></button>',
    '</div>'
  ].join("");
  document.body.appendChild(dialog);
  const projectName = dialog.querySelector(".project-coming-soon-name");
  const close = dialog.querySelector(".project-coming-soon-close");
  const form = dialog.querySelector(".project-preview-form");
  const input = dialog.querySelector("#project-preview-code");
  const error = dialog.querySelector(".project-preview-error");
  let destination = null;
  function open(name, href) {
    destination = href;
    projectName.textContent = name;
    input.value = "";
    error.hidden = true;
    if (!dialog.open) dialog.showModal();
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim().toUpperCase() !== PREVIEW_CODE) {
      error.hidden = false;
      input.focus();
      return;
    }
    try { sessionStorage.setItem(ACCESS_KEY, "yes"); } catch (_) {}
    if (destination) location.assign(destination);
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (unlocked()) return;
      event.preventDefault();
      const url = new URL(link.href);
      open(projectFiles[url.pathname.split("/").pop().toLowerCase()], url.href);
    });
  });
  if (requested && Object.hasOwn(projectKeys, requested.toLowerCase())) {
    open(projectKeys[requested.toLowerCase()], requested.toLowerCase() + ".html");
    params.delete("kommer-snart");
    history.replaceState(null, "", location.pathname + (params.size ? "?" + params : "") + location.hash);
  }
})();
