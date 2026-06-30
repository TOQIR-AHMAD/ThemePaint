// ThemeForge webview — renders the editor UI and drives the live-preview loop.
// The extension host is the only writer of settings; we send intent messages.
(function () {
  const vscode = acquireVsCodeApi();

  /** @type {any} */
  let data = null; // { colorGroups, tokenTypes, semanticTypes, starters, savedThemes, theme, target, json, contrast }
  let activeTab = "ui";
  let showAllColors = false;
  let colorSearch = "";

  const app = document.getElementById("tf-app");

  window.addEventListener("load", () => vscode.postMessage({ type: "ready" }));

  window.addEventListener("message", (event) => {
    const msg = event.data;
    switch (msg.type) {
      case "init":
        data = msg.data;
        renderAll();
        break;
      case "loadTheme":
        data.theme = msg.theme;
        data.target = msg.target;
        data.json = msg.json;
        data.contrast = msg.contrast;
        renderAll();
        break;
      case "sync":
        data.json = msg.json;
        data.contrast = msg.contrast;
        if (msg.name !== undefined) data.theme.name = msg.name;
        if (msg.kind !== undefined) data.theme.type = msg.kind;
        refreshJson();
        refreshContrast();
        break;
      case "savedThemesUpdated":
        data.savedThemes = msg.savedThemes;
        if (activeTab === "themes") renderTabBody();
        break;
      case "exportResult":
        showExportResult(msg.result);
        break;
      case "cursorToken":
        showCursorToken(msg.info);
        break;
      case "status":
        toast(msg.level, msg.text);
        break;
    }
  });

  // ---- messaging helpers ----------------------------------------------------
  const send = (m) => vscode.postMessage(m);

  // ---- top-level render -----------------------------------------------------
  function renderAll() {
    if (!data) return;
    app.innerHTML = "";
    app.appendChild(buildToolbar());
    app.appendChild(buildContrastBar());
    app.appendChild(buildTabs());
    const body = el("div", "tf-tab-body");
    body.id = "tf-tab-body";
    app.appendChild(body);
    renderTabBody();
    app.appendChild(buildToast());
  }

  function buildToolbar() {
    const bar = el("div", "tf-toolbar");

    const title = el("div", "tf-title");
    title.innerHTML = `<strong>ThemeForge</strong>`;
    bar.appendChild(title);

    // Theme name
    const name = inputText(data.theme.name, "Theme name");
    name.classList.add("tf-name");
    name.addEventListener("change", () => send({ type: "setMeta", name: name.value }));
    bar.appendChild(labeled("Name", name));

    // Type
    const kind = el("select", "tf-select");
    ["dark", "light", "hc-black"].forEach((k) => {
      const o = el("option");
      o.value = k;
      o.textContent = k;
      if (data.theme.type === k) o.selected = true;
      kind.appendChild(o);
    });
    kind.addEventListener("change", () => send({ type: "setMeta", kind: kind.value }));
    bar.appendChild(labeled("Type", kind));

    // Start from
    const starter = el("select", "tf-select");
    const ph = el("option");
    ph.value = "";
    ph.textContent = "Start from…";
    starter.appendChild(ph);
    (data.starters || []).forEach((s) => {
      const o = el("option");
      o.value = s.id;
      o.textContent = s.name;
      starter.appendChild(o);
    });
    bar.appendChild(labeled("Starter", starter));

    bar.appendChild(
      button("Load", () => {
        if (starter.value) send({ type: "loadStarter", id: starter.value, fork: false });
      })
    );
    bar.appendChild(
      button("Fork", () => {
        if (starter.value) send({ type: "loadStarter", id: starter.value, fork: true });
      })
    );

    // Target toggle
    const target = el("select", "tf-select");
    [
      ["global", "User (Global)"],
      ["workspace", "Workspace"],
    ].forEach(([v, t]) => {
      const o = el("option");
      o.value = v;
      o.textContent = t;
      if (data.target === v) o.selected = true;
      target.appendChild(o);
    });
    target.addEventListener("change", () => send({ type: "setTarget", target: target.value }));
    bar.appendChild(labeled("Apply to", target));

    const spacer = el("div", "tf-spacer");
    bar.appendChild(spacer);

    bar.appendChild(button("Save", () => send({ type: "saveTheme" }), "primary"));
    bar.appendChild(button("Save to file…", () => send({ type: "saveToFile" })));
    bar.appendChild(button("Export…", () => send({ type: "export" })));
    bar.appendChild(button("Revert", () => send({ type: "revert" }), "danger"));
    return bar;
  }

  function buildContrastBar() {
    const bar = el("div", "tf-contrast");
    bar.id = "tf-contrast";
    renderContrastInto(bar);
    return bar;
  }

  function renderContrastInto(bar) {
    bar.innerHTML = "";
    const label = el("span", "tf-contrast-title");
    label.textContent = "Contrast (AA 4.5:1): ";
    bar.appendChild(label);
    const results = data.contrast || [];
    if (!results.length) {
      const none = el("span", "tf-muted");
      none.textContent = "set editor bg + a few foregrounds to see ratios";
      bar.appendChild(none);
      return;
    }
    results.forEach((r) => {
      const chip = el("span", "tf-chip " + (r.aaNormal ? "pass" : r.aaLarge ? "warn" : "fail"));
      chip.textContent = `${r.label} ${r.ratio}:1`;
      chip.title = r.aaNormal
        ? "Passes AA for normal text"
        : r.aaLarge
        ? "Passes AA only for large text (≥3:1)"
        : "Fails AA (below 3:1)";
      bar.appendChild(chip);
    });
  }
  function refreshContrast() {
    const bar = document.getElementById("tf-contrast");
    if (bar) renderContrastInto(bar);
  }

  function buildTabs() {
    const tabs = el("div", "tf-tabs");
    const defs = [
      ["ui", "UI Colors"],
      ["syntax", "Syntax"],
      ["semantic", "Semantic"],
      ["themes", "My Themes"],
      ["json", "JSON"],
      ["target", "Click-to-target"],
    ];
    defs.forEach(([id, label]) => {
      const b = el("button", "tf-tab" + (activeTab === id ? " active" : ""));
      b.textContent = label;
      b.addEventListener("click", () => {
        activeTab = id;
        renderAll();
      });
      tabs.appendChild(b);
    });
    return tabs;
  }

  function renderTabBody() {
    const body = document.getElementById("tf-tab-body");
    if (!body) return;
    body.innerHTML = "";
    switch (activeTab) {
      case "ui":
        body.appendChild(buildUiTab());
        break;
      case "syntax":
        body.appendChild(buildSyntaxTab());
        break;
      case "semantic":
        body.appendChild(buildSemanticTab());
        break;
      case "themes":
        body.appendChild(buildThemesTab());
        break;
      case "json":
        body.appendChild(buildJsonTab());
        break;
      case "target":
        body.appendChild(buildTargetTab());
        break;
    }
  }

  // ---- UI Colors tab --------------------------------------------------------
  function buildUiTab() {
    const wrap = el("div");

    const controls = el("div", "tf-controls");
    const search = inputText(colorSearch, "Search colors…");
    search.classList.add("tf-search");
    search.addEventListener("input", () => {
      colorSearch = search.value.toLowerCase();
      filterColorRows();
    });
    controls.appendChild(search);

    const moreLbl = el("label", "tf-checkline");
    const more = el("input");
    more.type = "checkbox";
    more.checked = showAllColors;
    more.addEventListener("change", () => {
      showAllColors = more.checked;
      renderTabBody();
    });
    moreLbl.appendChild(more);
    moreLbl.appendChild(document.createTextNode(" Show advanced / add any color ID"));
    controls.appendChild(moreLbl);
    wrap.appendChild(controls);

    data.colorGroups.forEach((g) => {
      const section = el("section", "tf-group");
      const h = el("h3", "tf-group-title");
      h.textContent = g.group;
      section.appendChild(h);
      g.colors.forEach((c) => section.appendChild(colorRow(c.id, c.label)));
      wrap.appendChild(section);
    });

    if (showAllColors) {
      wrap.appendChild(buildAddColorSection());
      // Any colors currently set that aren't in the curated list:
      const known = new Set(data.colorGroups.flatMap((g) => g.colors.map((c) => c.id)));
      const extras = Object.keys(data.theme.colors).filter((id) => !known.has(id));
      if (extras.length) {
        const section = el("section", "tf-group");
        const h = el("h3", "tf-group-title");
        h.textContent = "Other set colors";
        section.appendChild(h);
        extras.forEach((id) => section.appendChild(colorRow(id, id)));
        wrap.appendChild(section);
      }
    }
    return wrap;
  }

  function buildAddColorSection() {
    const section = el("section", "tf-group");
    const h = el("h3", "tf-group-title");
    h.textContent = "Add any color ID";
    section.appendChild(h);
    const row = el("div", "tf-addrow");
    const idInput = inputText("", "e.g. editorBracketHighlight.foreground1");
    const hex = inputText("", "#rrggbb or #rrggbbaa");
    row.appendChild(idInput);
    row.appendChild(hex);
    row.appendChild(
      button("Add", () => {
        const id = idInput.value.trim();
        const v = normalizeHex(hex.value);
        if (id && v) {
          data.theme.colors[id] = v;
          send({ type: "setColor", id, value: v });
          idInput.value = "";
          hex.value = "";
          renderTabBody();
        }
      })
    );
    section.appendChild(row);
    return section;
  }

  function colorRow(id, label) {
    const cur = data.theme.colors[id] || "";
    const row = el("div", "tf-row");
    row.dataset.search = (label + " " + id).toLowerCase();

    const swatch = el("input", "tf-swatch");
    swatch.type = "color";
    swatch.value = toRgbHex(cur) || "#000000";
    swatch.addEventListener("input", () => {
      const v = swatch.value;
      hex.value = v;
      data.theme.colors[id] = v;
      send({ type: "setColor", id, value: v });
    });

    const main = el("div", "tf-row-main");
    const lab = el("span", "tf-row-label");
    lab.textContent = label;
    const code = el("code", "tf-row-id");
    code.textContent = id;
    main.appendChild(lab);
    main.appendChild(code);

    const hex = inputText(cur, "default");
    hex.classList.add("tf-hex");
    hex.addEventListener("change", () => {
      const raw = hex.value.trim();
      if (!raw) {
        delete data.theme.colors[id];
        send({ type: "resetColor", id });
        return;
      }
      const v = normalizeHex(raw);
      if (v) {
        hex.value = v;
        data.theme.colors[id] = v;
        swatch.value = toRgbHex(v) || swatch.value;
        send({ type: "setColor", id, value: v });
      }
    });

    const reset = button("⟲", () => {
      delete data.theme.colors[id];
      hex.value = "";
      send({ type: "resetColor", id });
    });
    reset.classList.add("tf-icon");
    reset.title = "Reset to theme default";

    row.appendChild(swatch);
    row.appendChild(main);
    row.appendChild(hex);
    row.appendChild(reset);
    return row;
  }

  function filterColorRows() {
    document.querySelectorAll(".tf-row").forEach((row) => {
      const s = row.dataset.search || "";
      row.style.display = !colorSearch || s.includes(colorSearch) ? "" : "none";
    });
    // Hide empty groups.
    document.querySelectorAll(".tf-group").forEach((g) => {
      const rows = g.querySelectorAll(".tf-row");
      const anyVisible = Array.from(rows).some((r) => r.style.display !== "none");
      g.style.display = rows.length && !anyVisible ? "none" : "";
    });
  }

  // ---- Syntax tab -----------------------------------------------------------
  function buildSyntaxTab() {
    const wrap = el("div");
    const hint = el("p", "tf-muted");
    hint.innerHTML =
      'Tip: open a sample file to watch changes live — ';
    const sampleBtn = button("Open sample code", () => send({ type: "openSample" }));
    hint.appendChild(sampleBtn);
    wrap.appendChild(hint);

    const section = el("section", "tf-group");
    const h = el("h3", "tf-group-title");
    h.textContent = "Token types";
    section.appendChild(h);
    data.tokenTypes.forEach((t) => section.appendChild(tokenRow(t)));
    wrap.appendChild(section);

    wrap.appendChild(buildAdvancedRules());
    return wrap;
  }

  function tokenRow(t) {
    const cur = data.theme.tokens[t.id] || {};
    const row = el("div", "tf-row");

    const swatch = el("input", "tf-swatch");
    swatch.type = "color";
    swatch.value = toRgbHex(cur.foreground) || "#808080";
    swatch.addEventListener("input", () => {
      const v = swatch.value;
      hex.value = v;
      ensureToken(t.id).foreground = v;
      send({ type: "setToken", id: t.id, foreground: v });
    });

    const main = el("div", "tf-row-main");
    const lab = el("span", "tf-row-label");
    lab.textContent = t.label;
    main.appendChild(lab);

    const hex = inputText(cur.foreground || "", "default");
    hex.classList.add("tf-hex");
    hex.addEventListener("change", () => {
      const v = normalizeHex(hex.value);
      ensureToken(t.id).foreground = v || undefined;
      send({ type: "setToken", id: t.id, foreground: v || "" });
      if (v) swatch.value = toRgbHex(v) || swatch.value;
    });

    const styles = el("div", "tf-styles");
    [["bold", "B"], ["italic", "I"], ["underline", "U"]].forEach(([flag, glyph]) => {
      const b = el("button", "tf-style" + (hasStyle(cur.fontStyle, flag) ? " on" : ""));
      b.textContent = glyph;
      b.style.fontWeight = flag === "bold" ? "700" : "";
      b.style.fontStyle = flag === "italic" ? "italic" : "";
      b.style.textDecoration = flag === "underline" ? "underline" : "";
      b.addEventListener("click", () => {
        const tok = ensureToken(t.id);
        tok.fontStyle = toggleStyle(tok.fontStyle, flag);
        b.classList.toggle("on");
        send({ type: "setToken", id: t.id, fontStyle: tok.fontStyle });
      });
      styles.appendChild(b);
    });

    const reset = button("⟲", () => {
      delete data.theme.tokens[t.id];
      send({ type: "resetToken", id: t.id });
      renderTabBody();
    });
    reset.classList.add("tf-icon");

    row.appendChild(swatch);
    row.appendChild(main);
    row.appendChild(styles);
    row.appendChild(hex);
    row.appendChild(reset);
    return row;
  }

  function buildAdvancedRules() {
    const section = el("section", "tf-group");
    const h = el("h3", "tf-group-title");
    h.textContent = "Advanced scopes";
    section.appendChild(h);

    const list = el("div");
    (data.theme.advancedRules || []).forEach((rule, i) => {
      const r = el("div", "tf-rule");
      const scope = el("code", "tf-row-id");
      scope.textContent = Array.isArray(rule.scope) ? rule.scope.join(", ") : rule.scope;
      const sw = el("span", "tf-mini-swatch");
      sw.style.background = rule.settings.foreground || "transparent";
      const meta = el("span", "tf-muted");
      meta.textContent = (rule.settings.foreground || "") + (rule.settings.fontStyle ? " · " + rule.settings.fontStyle : "");
      const del = button("✕", () => send({ type: "removeAdvancedRule", index: i }));
      del.classList.add("tf-icon");
      r.appendChild(sw);
      r.appendChild(scope);
      r.appendChild(meta);
      r.appendChild(del);
      list.appendChild(r);
    });
    section.appendChild(list);

    const row = el("div", "tf-addrow");
    const scopeIn = inputText("", "scope e.g. variable.parameter");
    const hex = inputText("", "#rrggbb");
    const style = inputText("", "fontStyle e.g. italic");
    row.appendChild(scopeIn);
    row.appendChild(hex);
    row.appendChild(style);
    row.appendChild(
      button("Add rule", () => {
        const scope = scopeIn.value.trim();
        if (!scope) return;
        send({
          type: "addAdvancedRule",
          scope,
          foreground: normalizeHex(hex.value) || "",
          fontStyle: style.value.trim(),
        });
      })
    );
    section.appendChild(row);

    const guide = el("p", "tf-muted");
    guide.appendChild(
      button("Inspect scopes in editor", () => send({ type: "inspectScopes" }))
    );
    section.appendChild(guide);
    return section;
  }

  // ---- Semantic tab ---------------------------------------------------------
  function buildSemanticTab() {
    const wrap = el("div");
    const enableLbl = el("label", "tf-checkline");
    const enable = el("input");
    enable.type = "checkbox";
    enable.checked = !!data.theme.semanticEnabled;
    enable.addEventListener("change", () =>
      send({ type: "setSemanticEnabled", enabled: enable.checked })
    );
    enableLbl.appendChild(enable);
    enableLbl.appendChild(document.createTextNode(" Enable semantic highlighting"));
    wrap.appendChild(enableLbl);

    const section = el("section", "tf-group");
    const h = el("h3", "tf-group-title");
    h.textContent = "Semantic token types";
    section.appendChild(h);
    data.semanticTypes.forEach((t) => section.appendChild(semanticRow(t)));
    wrap.appendChild(section);
    return wrap;
  }

  function semanticRow(t) {
    const cur = data.theme.semantic[t.id] || {};
    const row = el("div", "tf-row");

    const swatch = el("input", "tf-swatch");
    swatch.type = "color";
    swatch.value = toRgbHex(cur.foreground) || "#808080";
    swatch.addEventListener("input", () => {
      const v = swatch.value;
      hex.value = v;
      send({ type: "setSemantic", id: t.id, foreground: v });
    });

    const main = el("div", "tf-row-main");
    const lab = el("span", "tf-row-label");
    lab.textContent = t.label;
    const code = el("code", "tf-row-id");
    code.textContent = t.id;
    main.appendChild(lab);
    main.appendChild(code);

    const hex = inputText(cur.foreground || "", "default");
    hex.classList.add("tf-hex");
    hex.addEventListener("change", () => {
      const v = normalizeHex(hex.value);
      send({ type: "setSemantic", id: t.id, foreground: v || "" });
      if (v) swatch.value = toRgbHex(v) || swatch.value;
    });

    const styles = el("div", "tf-styles");
    [["bold", "B"], ["italic", "I"]].forEach(([flag, glyph]) => {
      const b = el("button", "tf-style" + (cur[flag] ? " on" : ""));
      b.textContent = glyph;
      b.addEventListener("click", () => {
        const on = !b.classList.contains("on");
        b.classList.toggle("on");
        send({ type: "setSemantic", id: t.id, [flag]: on });
      });
      styles.appendChild(b);
    });

    const reset = button("⟲", () => {
      send({ type: "resetSemantic", id: t.id });
      renderTabBody();
    });
    reset.classList.add("tf-icon");

    row.appendChild(swatch);
    row.appendChild(main);
    row.appendChild(styles);
    row.appendChild(hex);
    row.appendChild(reset);
    return row;
  }

  // ---- My Themes tab --------------------------------------------------------
  function buildThemesTab() {
    const wrap = el("div");
    wrap.appendChild(
      button("Save current theme", () => send({ type: "saveTheme" }), "primary")
    );
    const list = el("div", "tf-themes");
    const saved = data.savedThemes || [];
    if (!saved.length) {
      const p = el("p", "tf-muted");
      p.textContent = "No saved themes yet. Edit colors, then Save.";
      list.appendChild(p);
    }
    saved.forEach((s) => {
      const card = el("div", "tf-theme-card");
      const name = el("div", "tf-theme-name");
      name.textContent = `${s.name} (${s.type})`;
      card.appendChild(name);
      const actions = el("div", "tf-theme-actions");
      actions.appendChild(button("Load", () => send({ type: "loadSaved", id: s.id })));
      actions.appendChild(
        button("Rename", () => {
          // Inline rename: window.prompt is disabled in VS Code webviews.
          name.textContent = "";
          const input = inputText(s.name, "New name");
          const ok = button("Save", () => {
            const n = input.value.trim();
            if (n) send({ type: "renameSaved", id: s.id, name: n });
          }, "primary");
          name.appendChild(input);
          name.appendChild(ok);
          input.focus();
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") ok.click();
          });
        })
      );
      actions.appendChild(button("Duplicate", () => send({ type: "duplicateSaved", id: s.id })));
      actions.appendChild(button("Delete", () => send({ type: "deleteSaved", id: s.id }), "danger"));
      card.appendChild(actions);
      list.appendChild(card);
    });
    wrap.appendChild(list);
    return wrap;
  }

  // ---- JSON tab -------------------------------------------------------------
  function buildJsonTab() {
    const wrap = el("div");
    const controls = el("div", "tf-controls");
    controls.appendChild(
      button("Copy JSON", () => {
        navigator.clipboard?.writeText(data.json || "");
        toast("info", "Theme JSON copied to clipboard.");
      })
    );
    wrap.appendChild(controls);
    const pre = el("pre", "tf-json");
    pre.id = "tf-json";
    pre.textContent = data.json || "";
    wrap.appendChild(pre);
    return wrap;
  }
  function refreshJson() {
    const pre = document.getElementById("tf-json");
    if (pre) pre.textContent = data.json || "";
  }

  // ---- Click-to-target tab --------------------------------------------------
  function buildTargetTab() {
    const wrap = el("div");
    const p = el("p");
    p.innerHTML =
      "Click a token in your code, then use one of these. <em>Semantic</em> mapping works " +
      "when the language has a semantic provider (TS/JS, etc.); otherwise use the TextMate " +
      "scope inspector and paste the scope into <strong>Syntax → Advanced scopes</strong>.";
    wrap.appendChild(p);

    const controls = el("div", "tf-controls");
    controls.appendChild(button("Open sample code", () => send({ type: "openSample" })));
    controls.appendChild(
      button("Identify semantic token at cursor", () => send({ type: "pickFromCursor" }), "primary")
    );
    controls.appendChild(button("Inspect TextMate scopes", () => send({ type: "inspectScopes" })));
    wrap.appendChild(controls);

    const result = el("div", "tf-target-result");
    result.id = "tf-target-result";
    wrap.appendChild(result);
    return wrap;
  }

  function showCursorToken(info) {
    const box = document.getElementById("tf-target-result");
    if (!box) return;
    box.innerHTML = "";
    const line = el("div", info.ok ? "tf-chip pass" : "tf-chip warn");
    line.textContent = info.message;
    box.appendChild(line);
    if (info.ok && info.tokenType) {
      const known = (data.semanticTypes || []).some((s) => s.id === info.tokenType);
      const act = el("div", "tf-controls");
      if (known) {
        act.appendChild(
          button(`Recolor "${info.tokenType}" in Semantic tab`, () => {
            activeTab = "semantic";
            if (!data.theme.semanticEnabled) {
              data.theme.semanticEnabled = true;
              send({ type: "setSemanticEnabled", enabled: true });
            }
            renderAll();
          }, "primary")
        );
      } else {
        const note = el("p", "tf-muted");
        note.textContent = `"${info.tokenType}" isn't in the curated semantic list — add a rule for it in the JSON, or use a TextMate scope.`;
        act.appendChild(note);
      }
      box.appendChild(act);
    }
  }

  function showExportResult(result) {
    activeTab = "json";
    renderAll();
    const body = document.getElementById("tf-tab-body");
    if (!body) return;
    const box = el("div", "tf-export-result");
    box.innerHTML =
      `<h3>Export complete</h3>` +
      `<p><strong>Folder:</strong> <code>${escapeHtml(result.folder)}</code></p>` +
      (result.vsixPath ? `<p><strong>VSIX:</strong> <code>${escapeHtml(result.vsixPath)}</code></p>` : "") +
      `<p>${escapeHtml(result.vsceMessage)}</p>` +
      `<p>Package manually with:</p><pre class="tf-json">${escapeHtml(result.packageCommand)}</pre>`;
    body.insertBefore(box, body.firstChild);
  }

  // ---- tiny helpers ---------------------------------------------------------
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function inputText(value, placeholder) {
    const i = el("input", "tf-input");
    i.type = "text";
    i.value = value || "";
    if (placeholder) i.placeholder = placeholder;
    return i;
  }
  function button(label, onClick, variant) {
    const b = el("button", "tf-btn" + (variant ? " " + variant : ""));
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }
  function labeled(label, control) {
    const w = el("div", "tf-field");
    const l = el("label", "tf-field-label");
    l.textContent = label;
    w.appendChild(l);
    w.appendChild(control);
    return w;
  }
  function ensureToken(id) {
    if (!data.theme.tokens[id]) data.theme.tokens[id] = {};
    return data.theme.tokens[id];
  }
  function hasStyle(fontStyle, flag) {
    return (fontStyle || "").split(/\s+/).includes(flag);
  }
  function toggleStyle(fontStyle, flag) {
    const parts = (fontStyle || "").split(/\s+/).filter(Boolean);
    const idx = parts.indexOf(flag);
    if (idx >= 0) parts.splice(idx, 1);
    else parts.push(flag);
    return parts.join(" ");
  }
  function normalizeHex(s) {
    if (!s) return "";
    let h = s.trim();
    if (!h.startsWith("#")) h = "#" + h;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(h)) {
      return h.toLowerCase();
    }
    return "";
  }
  function toRgbHex(s) {
    const v = normalizeHex(s);
    if (!v) return "";
    let h = v.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6);
    return "#" + h;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // ---- toast ----------------------------------------------------------------
  function buildToast() {
    const t = el("div", "tf-toast-host");
    t.id = "tf-toast-host";
    return t;
  }
  function toast(level, text) {
    const host = document.getElementById("tf-toast-host");
    if (!host) return;
    const t = el("div", "tf-toast " + level);
    t.textContent = text;
    host.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 4000);
  }
})();
