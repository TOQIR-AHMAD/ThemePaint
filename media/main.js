// ThemePaint sidebar — a simple picker for the bundled themes.
(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById("app");

  let themes = [];
  let current = undefined;

  window.addEventListener("load", () => vscode.postMessage({ type: "ready" }));

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.type === "init") {
      themes = msg.themes || [];
      current = msg.current;
      render();
    } else if (msg.type === "current") {
      current = msg.current;
      render();
    }
  });

  function render() {
    app.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "intro";
    intro.textContent = "Pick a theme to apply it.";
    app.appendChild(intro);

    const list = document.createElement("div");
    list.className = "list";
    themes.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "theme" + (t.label === current ? " active" : "");
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = t.label;
      btn.appendChild(name);
      const kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = uiKind(t.uiTheme);
      btn.appendChild(kind);
      if (t.label === current) {
        const check = document.createElement("span");
        check.className = "check";
        check.textContent = "✓";
        btn.appendChild(check);
      }
      btn.addEventListener("click", () => {
        current = t.label;
        vscode.postMessage({ type: "apply", label: t.label });
        render();
      });
      list.appendChild(btn);
    });
    app.appendChild(list);

    const reset = document.createElement("button");
    reset.className = "reset";
    reset.textContent = "Reset to my previous theme";
    reset.addEventListener("click", () => vscode.postMessage({ type: "reset" }));
    app.appendChild(reset);
  }

  function uiKind(ui) {
    if (ui === "vs") return "Light";
    if (ui === "hc-black" || ui === "hc-light") return "High contrast";
    return "Dark";
  }
})();
