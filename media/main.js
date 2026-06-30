// ThemePaint sidebar — a grouped, searchable theme picker with previews.
(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById("app");

  let themes = [];
  let current = undefined;
  let query = "";

  const GROUP_ORDER = ["Dark", "Light", "High Contrast", "Cybersecurity"];

  window.addEventListener("load", () => vscode.postMessage({ type: "ready" }));

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.type === "init") {
      themes = msg.themes || [];
      current = msg.current;
      render();
    } else if (msg.type === "current") {
      current = msg.current;
      updateActive();
    }
  });

  function render() {
    app.innerHTML = "";

    // Header
    const header = document.createElement("div");
    header.className = "header";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = "ThemePaint";
    const count = document.createElement("div");
    count.className = "subtitle";
    count.textContent = themes.length + " themes";
    header.appendChild(title);
    header.appendChild(count);
    app.appendChild(header);

    // Search
    const search = document.createElement("input");
    search.className = "search";
    search.type = "text";
    search.placeholder = "Search themes…";
    search.value = query;
    search.addEventListener("input", () => {
      query = search.value.toLowerCase();
      renderList();
    });
    app.appendChild(search);

    // List container
    const list = document.createElement("div");
    list.id = "list";
    app.appendChild(list);

    // Footer
    const footer = document.createElement("div");
    footer.className = "footer";
    const reset = document.createElement("button");
    reset.className = "reset";
    reset.textContent = "Reset to my previous theme";
    reset.addEventListener("click", () => vscode.postMessage({ type: "reset" }));
    footer.appendChild(reset);
    app.appendChild(footer);

    renderList();
  }

  function renderList() {
    const list = document.getElementById("list");
    if (!list) return;
    list.innerHTML = "";

    const filtered = themes.filter((t) => !query || t.label.toLowerCase().includes(query));

    GROUP_ORDER.forEach((group) => {
      const items = filtered.filter((t) => t.category === group);
      if (!items.length) return;

      const section = document.createElement("div");
      section.className = "group";
      const head = document.createElement("div");
      head.className = "group-head";
      head.textContent = group;
      const badge = document.createElement("span");
      badge.className = "group-count";
      badge.textContent = items.length;
      head.appendChild(badge);
      section.appendChild(head);

      items.forEach((t) => section.appendChild(themeCard(t)));
      list.appendChild(section);
    });

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No themes match “" + query + "”.";
      list.appendChild(empty);
    }
  }

  function themeCard(t) {
    const card = document.createElement("button");
    card.className = "card" + (t.label === current ? " active" : "");
    card.dataset.label = t.label;

    // Preview chip: theme background with a few color dots.
    const preview = document.createElement("span");
    preview.className = "preview";
    preview.style.background = t.bg;
    preview.style.borderColor = t.accent;
    (t.dots || []).forEach((c) => {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = c;
      preview.appendChild(dot);
    });

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = t.label.replace(/^Cyber:\s*/, "");

    const check = document.createElement("span");
    check.className = "check";
    check.textContent = "✓";

    card.appendChild(preview);
    card.appendChild(name);
    card.appendChild(check);

    card.addEventListener("click", () => {
      current = t.label;
      vscode.postMessage({ type: "apply", label: t.label });
      updateActive();
    });
    return card;
  }

  function updateActive() {
    document.querySelectorAll(".card").forEach((c) => {
      c.classList.toggle("active", c.dataset.label === current);
    });
  }
})();
