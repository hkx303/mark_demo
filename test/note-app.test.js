const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const {
  STORAGE_KEY,
  THEME_STORAGE_KEY,
  createStore,
  filterNotes,
  getNoteTitle,
  getPreview,
  loadTheme,
  saveTheme,
} = require("../app.js");

function createMemoryStorage(initialValue) {
  const entries = new Map();
  if (initialValue) entries.set(STORAGE_KEY, initialValue);

  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, value);
    },
  };
}

test("HTML renders the required two-pane note layout", () => {
  const html = readFileSync(join(__dirname, "../index.html"), "utf8");

  assert.match(html, /class="sidebar"/);
  assert.match(html, /id="noteList"/);
  assert.match(html, /class="editor"/);
  assert.match(html, /id="noteContent"/);
  assert.doesNotMatch(html, /id="noteCount"/);
  assert.match(html, /id="themeToggle"/);
});

test("theme preference defaults to light and persists valid choices", () => {
  const storage = createMemoryStorage();

  assert.equal(loadTheme(storage), "light");
  saveTheme(storage, "dark");
  assert.equal(storage.getItem(THEME_STORAGE_KEY), "dark");
  assert.equal(loadTheme(storage), "dark");
});

test("store creates, updates, deletes, and persists notes", () => {
  const storage = createMemoryStorage("[]");
  const store = createStore(storage);

  const note = store.add({ title: "会议记录", content: "讨论测试计划" });
  assert.equal(store.find(note.id).title, "会议记录");

  store.update(note.id, { title: "会议纪要", content: "已完成测试计划" });
  assert.equal(store.find(note.id).content, "已完成测试计划");

  assert.equal(store.remove(note.id), true);
  assert.equal(store.find(note.id), null);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), []);
});

test("search matches title and content case-insensitively", () => {
  const notes = [
    { id: "1", title: "Shopping", content: "Milk", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "2", title: "工作", content: "Review HTML app", updatedAt: "2026-01-02T00:00:00.000Z" },
  ];

  assert.deepEqual(
    filterNotes(notes, "html").map((note) => note.id),
    ["2"],
  );
  assert.deepEqual(
    filterNotes(notes, "shop").map((note) => note.id),
    ["1"],
  );
});

test("empty titles and content use readable fallback text", () => {
  const note = { title: "   ", content: "  \n  ", updatedAt: "2026-01-01T00:00:00.000Z" };

  assert.equal(getNoteTitle(note), "未命名笔记");
  assert.equal(getPreview(note), "暂无内容");
});
