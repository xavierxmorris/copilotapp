const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { createDemoStore, filterWorktrees, seedWorktrees } = require("../docs/worktree-management-demo.js");

test("filters worktrees by query and status", () => {
  assert.deepEqual(
    filterWorktrees(seedWorktrees, "release", "all").map((item) => item.id),
    ["wt-release-notes"]
  );
  assert.deepEqual(
    filterWorktrees(seedWorktrees, "", "changes").map((item) => item.id),
    ["wt-settings-search", "wt-pr-reliability", "wt-local-debug"]
  );
});

test("keeps selection on a visible worktree as filters change", () => {
  const store = createDemoStore(seedWorktrees);
  store.select("wt-settings-search");
  store.setStatus("archived");

  assert.equal(store.getState().selectedId, "wt-accessibility");
  assert.deepEqual(store.getVisible().map((item) => item.id), ["wt-accessibility"]);
});

test("creates a simulated worktree and selects it", () => {
  const store = createDemoStore(seedWorktrees);
  const created = store.create({
    project: "xavierxmorris/copilotapp",
    name: "Keyboard navigation polish",
    base: "main",
    type: "worktree"
  });
  const state = store.getState();

  assert.equal(state.selectedId, created.id);
  assert.equal(state.worktrees[0].name, "Keyboard navigation polish");
  assert.equal(state.worktrees[0].branch, "xavierxmorris/keyboard-navigation-polish");
  assert.match(state.worktrees[0].path, /copilot-worktrees/);
  assert.equal(state.worktrees[0].status, "active");
});

test("requires an archive request before changing status", () => {
  const store = createDemoStore(seedWorktrees);

  assert.equal(store.confirmArchive(), null);
  assert.equal(store.getState().worktrees[0].status, "active");

  store.requestArchive("wt-settings-search");
  const archived = store.confirmArchive();

  assert.equal(archived.status, "archived");
  assert.equal(store.getState().pendingArchiveId, null);
  assert.equal(store.getState().worktrees[0].activity[0].label, "Worktree archived in simulation");
});

test("includes accessible landmarks, labels, dialogs, and live feedback", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "docs", "worktree-management-demo.html"),
    "utf8"
  );

  assert.match(html, /<main id="main-content"/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /role="listbox"/);
  assert.match(html, /<label class="sr-only" for="worktree-search"/);
  assert.match(html, /<dialog id="create-dialog" aria-labelledby="create-title">/);
  assert.match(html, /<dialog id="archive-dialog" aria-labelledby="archive-title">/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /No repositories, branches, or files will change/);
});
