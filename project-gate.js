/* Temporary project gate. Remove when project case studies are ready. */
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
  const links = [...document.querySelectorAll("a[href]")].filter((link) => {
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin &&
      Object.hasOwn(projectFiles, url.pathname.split("/").pop().toLowerCase());
  });

  const requested = new URLSearchParams(location.search).get("kommer-snart");
  if (!links.length && !requested) return;

  const dialog = document.createElement("dialog");
  dialog.className = "project-coming-soon";
  dialog.setAttribute("aria-labelledby", "project-coming-soon-title");
  dialog.setAttribute("aria-describedby", "project-coming-soon-text");
  dialog.innerHTML = [
    '<div class="project-coming-soon-inner">',
    '<span class="project-coming-soon-label">UNDER ARBEID / ✳</span>',
    '<h2 id="project-coming-soon-title">Kommer<br><em>snart.</em></h2>',
    '<p id="project-coming-soon-text"><strong class="project-coming-soon-name"></strong> er ikke helt klar for besøk ennå. Jeg finpusser prosjektet og deler mer her snart!</p>',
    '<button class="project-coming-soon-close" type="button">Tilbake til prosjektene <span aria-hidden="true">↗</span></button>',
    '</div>'
  ].join("");
  document.body.appendChild(dialog);

  const projectName = dialog.querySelector(".project-coming-soon-name");
  const close = dialog.querySelector(".project-coming-soon-close");

  function open(name) {
    projectName.textContent = name;
    if (!dialog.open) dialog.showModal();
  }
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(projectFiles[new URL(link.href).pathname.split("/").pop().toLowerCase()]);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const fromDirectLink = params.get("kommer-snart");
  if (fromDirectLink && Object.hasOwn(projectKeys, fromDirectLink.toLowerCase())) {
    open(projectKeys[fromDirectLink.toLowerCase()]);
    params.delete("kommer-snart");
    const query = params.toString();
    history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash);
  }
})();
