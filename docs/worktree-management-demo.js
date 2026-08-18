(function (global) {
  "use strict";

  const seedWorktrees = [
    {
      id: "wt-settings-search",
      name: "Improve settings search",
      project: "xavierxmorris/copilotapp",
      branch: "xavierxmorris/settings-search",
      baseBranch: "main",
      path: "~/copilot-worktrees/copilotapp/settings-search",
      status: "active",
      lastActive: "Just now",
      lastActiveOrder: 1,
      changes: { total: 7, added: 84, removed: 19 },
      type: "Worktree",
      agent: "Copilot CLI",
      activity: [
        { label: "Agent is implementing search indexing", time: "Just now", kind: "spark" },
        { label: "7 working tree changes detected", time: "2 minutes ago", kind: "changes" },
        { label: "Session started from main", time: "38 minutes ago", kind: "branch" }
      ]
    },
    {
      id: "wt-pr-reliability",
      name: "PR workflow reliability",
      project: "xavierxmorris/copilotapp",
      branch: "xavierxmorris/pr-workflow-reliability",
      baseBranch: "main",
      path: "~/copilot-worktrees/copilotapp/pr-workflow-reliability",
      status: "idle",
      lastActive: "18 min ago",
      lastActiveOrder: 2,
      changes: { total: 3, added: 46, removed: 12 },
      type: "Worktree",
      agent: "Copilot CLI",
      activity: [
        { label: "Agent completed validation", time: "18 minutes ago", kind: "check" },
        { label: "3 working tree changes detected", time: "24 minutes ago", kind: "changes" },
        { label: "Session started from main", time: "Yesterday", kind: "branch" }
      ]
    },
    {
      id: "wt-release-notes",
      name: "Draft v0.3 release notes",
      project: "xavierxmorris/copilotapp",
      branch: "releases/v0.3-notes",
      baseBranch: "releases/v0.3",
      path: "~/copilot-worktrees/copilotapp/release-notes",
      status: "idle",
      lastActive: "Yesterday",
      lastActiveOrder: 3,
      changes: { total: 0, added: 0, removed: 0 },
      type: "Worktree",
      agent: "Copilot CLI",
      activity: [
        { label: "Session is ready to resume", time: "Yesterday", kind: "pause" },
        { label: "Working tree is clean", time: "Yesterday", kind: "check" },
        { label: "Session started from releases/v0.3", time: "2 days ago", kind: "branch" }
      ]
    },
    {
      id: "wt-accessibility",
      name: "Accessibility readiness",
      project: "xavierxmorris/copilotapp",
      branch: "xavierxmorris/accessibility-readiness",
      baseBranch: "main",
      path: "~/copilot-worktrees/copilotapp/accessibility-readiness",
      status: "archived",
      lastActive: "Aug 14",
      lastActiveOrder: 4,
      changes: { total: 0, added: 0, removed: 0 },
      type: "Worktree",
      agent: "Copilot CLI",
      activity: [
        { label: "Worktree archived", time: "Aug 14", kind: "archive" },
        { label: "Changes published in pull request #248", time: "Aug 14", kind: "check" },
        { label: "Session started from main", time: "Aug 11", kind: "branch" }
      ]
    },
    {
      id: "wt-local-debug",
      name: "Debug local notifications",
      project: "github/design-system",
      branch: "debug/notification-focus",
      baseBranch: "main",
      path: "~/Developer/design-system",
      status: "idle",
      lastActive: "Aug 12",
      lastActiveOrder: 5,
      changes: { total: 11, added: 203, removed: 71 },
      type: "Branch",
      agent: "Copilot CLI",
      activity: [
        { label: "11 working tree changes detected", time: "Aug 12", kind: "changes" },
        { label: "Branch workspace opened in place", time: "Aug 12", kind: "branch" },
        { label: "Session started from main", time: "Aug 12", kind: "spark" }
      ]
    }
  ];

  function cloneWorktrees(items) {
    return items.map((item) => ({
      ...item,
      changes: { ...item.changes },
      activity: item.activity.map((entry) => ({ ...entry }))
    }));
  }

  function filterWorktrees(worktrees, query, status) {
    const normalized = query.trim().toLowerCase();
    return worktrees.filter((worktree) => {
      const matchesQuery =
        !normalized ||
        [worktree.name, worktree.branch, worktree.path, worktree.project]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesStatus =
        status === "all" ||
        worktree.status === status ||
        (status === "changes" && worktree.changes.total > 0 && worktree.status !== "archived");
      return matchesQuery && matchesStatus;
    });
  }

  function createDemoStore(initialWorktrees) {
    let state = {
      worktrees: cloneWorktrees(initialWorktrees || seedWorktrees),
      query: "",
      status: "all",
      preview: "ready",
      selectedId: (initialWorktrees || seedWorktrees)[0]?.id || null,
      pendingArchiveId: null
    };

    function ensureSelection() {
      const visible = filterWorktrees(state.worktrees, state.query, state.status);
      if (!visible.some((item) => item.id === state.selectedId)) {
        state.selectedId = visible[0]?.id || null;
      }
    }

    return {
      getState() {
        return {
          ...state,
          worktrees: cloneWorktrees(state.worktrees)
        };
      },
      getVisible() {
        return filterWorktrees(state.worktrees, state.query, state.status);
      },
      setQuery(query) {
        state.query = query;
        ensureSelection();
      },
      setStatus(status) {
        state.status = status;
        ensureSelection();
      },
      setPreview(preview) {
        state.preview = preview;
      },
      select(id) {
        if (state.worktrees.some((item) => item.id === id)) state.selectedId = id;
      },
      create(values) {
        const slug = values.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 36);
        const id = `wt-demo-${Date.now()}`;
        const owner = values.project.split("/")[0] || "demo";
        const worktree = {
          id,
          name: values.name,
          project: values.project,
          branch: `${owner}/${slug || "new-worktree"}`,
          baseBranch: values.base,
          path:
            values.type === "worktree"
              ? `~/copilot-worktrees/${values.project.split("/").pop()}/${slug || "new-worktree"}`
              : `~/Developer/${values.project.split("/").pop()}`,
          status: "active",
          lastActive: "Just now",
          lastActiveOrder: 0,
          changes: { total: 0, added: 0, removed: 0 },
          type: values.type === "worktree" ? "Worktree" : "Branch",
          agent: "Copilot CLI",
          activity: [
            { label: "Simulated session created", time: "Just now", kind: "spark" },
            { label: `Session started from ${values.base}`, time: "Just now", kind: "branch" }
          ]
        };
        state.worktrees = [worktree, ...state.worktrees];
        state.query = "";
        state.status = "all";
        state.preview = "ready";
        state.selectedId = id;
        return worktree;
      },
      requestArchive(id) {
        if (state.worktrees.some((item) => item.id === id)) state.pendingArchiveId = id;
      },
      cancelArchive() {
        state.pendingArchiveId = null;
      },
      confirmArchive() {
        const item = state.worktrees.find((worktree) => worktree.id === state.pendingArchiveId);
        if (!item) return null;
        item.status = "archived";
        item.activity.unshift({ label: "Worktree archived in simulation", time: "Just now", kind: "archive" });
        state.pendingArchiveId = null;
        if (state.status !== "all" && state.status !== "archived") ensureSelection();
        return item;
      }
    };
  }

  const api = { seedWorktrees, filterWorktrees, createDemoStore };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.WorktreeDemo = api;

  if (typeof document === "undefined") return;

  const store = createDemoStore(seedWorktrees);
  const list = document.getElementById("worktree-list");
  const listState = document.getElementById("list-state");
  const detail = document.getElementById("detail-panel");
  const count = document.getElementById("result-count");
  const search = document.getElementById("worktree-search");
  const statusFilter = document.getElementById("status-filter");
  const previewState = document.getElementById("preview-state");
  const createDialog = document.getElementById("create-dialog");
  const createForm = document.getElementById("create-form");
  const archiveDialog = document.getElementById("archive-dialog");
  const archiveForm = document.getElementById("archive-form");
  const archiveCopy = document.getElementById("archive-copy");
  const toastRegion = document.getElementById("toast-region");
  let lastTrigger = null;

  const icons = {
    branch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v13M17 7v4a6 6 0 0 1-6 6H7M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5ZM18 16l.7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7Z"/></svg>',
    changes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 5v14M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 5h4a5 5 0 0 1 5 5v3"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10M15 7v10"/></svg>',
    archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4ZM3 3h18v4H3ZM9 11h6"/></svg>',
    folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h7l2 2h9v11H3Z"/></svg>',
    open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 13v7H4V6h7"/></svg>',
    retry: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.6-4.6M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>',
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>',
    success: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.1V12a8 8 0 1 1-4.7-7.3M20 5l-9 9-3-3"/></svg>'
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function pluralize(countValue, singular) {
    return `${countValue} ${singular}${countValue === 1 ? "" : "s"}`;
  }

  function stateMarkup(kind) {
    if (kind === "loading") {
      return '<div class="skeleton-list" aria-label="Loading worktrees"><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div></div>';
    }
    if (kind === "error") {
      return `<div class="state-card">${icons.alert}<h3>Worktrees couldn’t load</h3><p>The demo hit a simulated loading error. Your repositories were not affected.</p><button class="secondary-button" id="retry-list" type="button">${icons.retry} Try again</button></div>`;
    }
    return `<div class="state-card"><span class="state-icon">${icons.search}</span><h3>No worktrees match</h3><p>Try a different search or reset the status filter.</p><button class="secondary-button" id="reset-filters" type="button">Reset filters</button></div>`;
  }

  function renderList() {
    const state = store.getState();
    const visible = store.getVisible();
    count.textContent = pluralize(visible.length, "worktree");

    if (state.preview !== "ready") {
      list.hidden = true;
      listState.hidden = false;
      listState.innerHTML = stateMarkup(state.preview);
      detail.innerHTML = '<div class="detail-empty"><div class="state-card"><span class="state-icon">' + (state.preview === "loading" ? icons.folder : icons.alert) + `</span><h3>${state.preview === "loading" ? "Loading details" : "Details unavailable"}</h3><p>${state.preview === "loading" ? "Fetching the selected worktree’s simulated activity." : "Try loading the worktree list again."}</p></div></div>`;
      document.getElementById("retry-list")?.addEventListener("click", () => {
        store.setPreview("ready");
        previewState.value = "ready";
        render();
      });
      return;
    }

    if (!visible.length) {
      list.hidden = true;
      listState.hidden = false;
      listState.innerHTML = stateMarkup("empty");
      detail.innerHTML = '<div class="detail-empty"><div class="state-card"><span class="state-icon">' + icons.folder + '</span><h3>No worktree selected</h3><p>Adjust the filters to inspect a project session.</p></div></div>';
      document.getElementById("reset-filters")?.addEventListener("click", () => {
        store.setQuery("");
        store.setStatus("all");
        search.value = "";
        statusFilter.value = "all";
        render();
        search.focus();
      });
      return;
    }

    list.hidden = false;
    listState.hidden = true;
    list.innerHTML = visible
      .map(
        (worktree) => `
          <button
            class="worktree-row"
            type="button"
            role="option"
            aria-selected="${worktree.id === state.selectedId}"
            data-worktree-id="${worktree.id}"
          >
            <span class="branch-node">${icons.branch}</span>
            <span>
              <span class="row-title">${escapeHtml(worktree.name)}</span>
              <span class="row-meta">
                <span class="branch-label">${escapeHtml(worktree.branch)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(worktree.lastActive)}</span>
              </span>
              <span class="row-path">${escapeHtml(worktree.path)}</span>
            </span>
            <span class="row-summary">
              <span class="status-badge status-${worktree.status}">
                <span class="status-dot" aria-hidden="true"></span>
                ${escapeHtml(worktree.status[0].toUpperCase() + worktree.status.slice(1))}
              </span>
              <span class="change-count"><strong>${worktree.changes.total}</strong> changes</span>
            </span>
          </button>`
      )
      .join("");

    list.querySelectorAll("[data-worktree-id]").forEach((row) => {
      row.addEventListener("click", () => {
        store.select(row.dataset.worktreeId);
        render();
      });
      row.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const rows = [...list.querySelectorAll("[data-worktree-id]")];
        const current = rows.indexOf(row);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? rows.length - 1
              : event.key === "ArrowDown"
                ? Math.min(rows.length - 1, current + 1)
                : Math.max(0, current - 1);
        rows[next].focus();
        rows[next].click();
      });
    });
  }

  function renderDetail() {
    const state = store.getState();
    if (state.preview !== "ready") return;
    const worktree = state.worktrees.find((item) => item.id === state.selectedId);
    if (!worktree) return;
    const canArchive = worktree.status !== "archived";

    detail.innerHTML = `
      <div class="detail-header">
        <div>
          <p class="eyebrow">${escapeHtml(worktree.project)}</p>
          <h2>${escapeHtml(worktree.name)}</h2>
          <span class="status-badge status-${worktree.status}">
            <span class="status-dot" aria-hidden="true"></span>
            ${escapeHtml(worktree.status[0].toUpperCase() + worktree.status.slice(1))}
          </span>
        </div>
        <div class="detail-actions">
          <button class="secondary-button" id="open-worktree" type="button">${icons.open} Open</button>
          ${canArchive ? `<button class="icon-button" id="archive-worktree" type="button" aria-label="Archive ${escapeHtml(worktree.name)}">${icons.archive}</button>` : ""}
        </div>
      </div>
      <section class="detail-section">
        <h3 class="detail-section-heading">Workspace</h3>
        <dl class="detail-grid">
          <div><dt>Branch</dt><dd class="branch-label">${escapeHtml(worktree.branch)}</dd></div>
          <div><dt>Based on</dt><dd class="branch-label">${escapeHtml(worktree.baseBranch)}</dd></div>
          <div><dt>Local path</dt><dd class="path-value">${escapeHtml(worktree.path)}</dd></div>
          <div><dt>Workspace type</dt><dd>${escapeHtml(worktree.type)}</dd></div>
          <div><dt>Last active</dt><dd>${escapeHtml(worktree.lastActive)}</dd></div>
          <div><dt>Running with</dt><dd>${escapeHtml(worktree.agent)}</dd></div>
        </dl>
      </section>
      <section class="detail-section">
        <h3 class="detail-section-heading">Working tree changes</h3>
        <div class="change-summary">
          <div class="change-metric"><strong>${worktree.changes.total}</strong><span>Files changed</span></div>
          <div class="change-metric"><strong>+${worktree.changes.added}</strong><span>Lines added</span></div>
          <div class="change-metric"><strong>−${worktree.changes.removed}</strong><span>Lines removed</span></div>
        </div>
      </section>
      <section class="detail-section">
        <h3 class="detail-section-heading">Recent activity</h3>
        <ol class="activity-list">
          ${worktree.activity
            .map(
              (entry) => `<li><span class="activity-icon">${icons[entry.kind] || icons.spark}</span><span><p>${escapeHtml(entry.label)}</p><time>${escapeHtml(entry.time)}</time></span></li>`
            )
            .join("")}
        </ol>
      </section>`;

    document.getElementById("open-worktree").addEventListener("click", (event) => {
      showToast(`Opened “${worktree.name}” in this prototype.`, event.currentTarget);
    });
    document.getElementById("archive-worktree")?.addEventListener("click", (event) => {
      lastTrigger = event.currentTarget;
      store.requestArchive(worktree.id);
      archiveCopy.textContent = `“${worktree.name}” will move to Archived in this prototype.`;
      archiveDialog.showModal();
    });
  }

  function render() {
    renderList();
    renderDetail();
  }

  function showToast(message, trigger) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `${icons.success}<p>${escapeHtml(message)} <strong>No Git action ran.</strong></p><button type="button" aria-label="Dismiss notification">×</button>`;
    toastRegion.replaceChildren(toast);
    toast.querySelector("button").addEventListener("click", () => toast.remove());
    window.setTimeout(() => toast.remove(), 5000);
    trigger?.focus();
  }

  function closeDialog(dialog, restoreFocus) {
    dialog.close();
    if (restoreFocus && lastTrigger) lastTrigger.focus();
  }

  search.addEventListener("input", () => {
    store.setQuery(search.value);
    render();
  });
  statusFilter.addEventListener("change", () => {
    store.setStatus(statusFilter.value);
    render();
  });
  previewState.addEventListener("change", () => {
    store.setPreview(previewState.value);
    render();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search.focus();
    }
  });

  document.getElementById("create-worktree").addEventListener("click", (event) => {
    lastTrigger = event.currentTarget;
    createForm.reset();
    createDialog.showModal();
    window.setTimeout(() => document.getElementById("create-name").focus(), 0);
  });
  document.querySelectorAll(".close-dialog").forEach((button) =>
    button.addEventListener("click", () => closeDialog(createDialog, true))
  );
  document.querySelectorAll(".close-archive-dialog").forEach((button) =>
    button.addEventListener("click", () => {
      store.cancelArchive();
      closeDialog(archiveDialog, true);
    })
  );

  createForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const created = store.create({
      project: document.getElementById("create-project").value,
      name: document.getElementById("create-name").value.trim(),
      base: document.getElementById("create-base").value,
      type: document.getElementById("create-type").value
    });
    search.value = "";
    statusFilter.value = "all";
    previewState.value = "ready";
    closeDialog(createDialog, false);
    render();
    showToast(`Created “${created.name}” in the demo.`, lastTrigger);
  });

  archiveForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const archived = store.confirmArchive();
    closeDialog(archiveDialog, false);
    render();
    if (archived) showToast(`Archived “${archived.name}” in the demo.`, lastTrigger);
  });

  [createDialog, archiveDialog].forEach((dialog) => {
    dialog.addEventListener("cancel", () => {
      store.cancelArchive();
      window.setTimeout(() => lastTrigger?.focus(), 0);
    });
  });

  render();
})(typeof window !== "undefined" ? window : globalThis);
