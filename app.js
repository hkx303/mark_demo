(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NoteApp = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STORAGE_KEY = "qingji.notes.v1";

  function nowIso() {
    return new Date().toISOString();
  }

  function createNote(title = "未命名笔记", content = "") {
    const timestamp = nowIso();
    return {
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  function getNoteTitle(note) {
    return note.title.trim() || "未命名笔记";
  }

  function getPreview(note) {
    const content = note.content.trim().replace(/\s+/g, " ");
    return content || "暂无内容";
  }

  function sortNotes(notes) {
    return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  function filterNotes(notes, query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortNotes(notes);

    return sortNotes(
      notes.filter((note) => {
        const searchableText = `${note.title} ${note.content}`.toLowerCase();
        return searchableText.includes(normalizedQuery);
      }),
    );
  }

  function createStore(storage) {
    let notes = loadNotes(storage);

    function persist() {
      storage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    return {
      all() {
        return sortNotes(notes);
      },
      find(id) {
        return notes.find((note) => note.id === id) || null;
      },
      add(partial = {}) {
        const note = createNote(partial.title, partial.content);
        notes = [note, ...notes];
        persist();
        return note;
      },
      update(id, changes) {
        let updatedNote = null;
        notes = notes.map((note) => {
          if (note.id !== id) return note;
          updatedNote = { ...note, ...changes, updatedAt: nowIso() };
          return updatedNote;
        });
        persist();
        return updatedNote;
      },
      remove(id) {
        const nextNotes = notes.filter((note) => note.id !== id);
        const removed = nextNotes.length !== notes.length;
        notes = nextNotes;
        persist();
        return removed;
      },
      search(query) {
        return filterNotes(notes, query);
      },
    };
  }

  function loadNotes(storage) {
    try {
      const rawNotes = storage.getItem(STORAGE_KEY);
      if (!rawNotes) return [createWelcomeNote()];
      const parsedNotes = JSON.parse(rawNotes);
      return Array.isArray(parsedNotes) ? parsedNotes : [createWelcomeNote()];
    } catch {
      return [createWelcomeNote()];
    }
  }

  function createWelcomeNote() {
    const timestamp = nowIso();
    return {
      id: "welcome-note",
      title: "欢迎使用清记",
      content: "在左侧新建或搜索笔记，在右侧编辑标题和正文。所有内容会自动保存在浏览器本地。",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  function formatDate(isoDate) {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDate));
  }

  function initApp(document, storage) {
    const store = createStore(storage);
    const elements = {
      addButton: document.getElementById("addNoteButton"),
      deleteButton: document.getElementById("deleteNoteButton"),
      emptyState: document.getElementById("emptyState"),
      editorPanel: document.getElementById("editorPanel"),
      noteContent: document.getElementById("noteContent"),
      noteList: document.getElementById("noteList"),
      noteTitle: document.getElementById("noteTitle"),
      savedState: document.getElementById("savedState"),
      searchInput: document.getElementById("searchInput"),
    };

    let activeNoteId = store.all()[0]?.id || null;

    function render() {
      const query = elements.searchInput.value;
      const visibleNotes = store.search(query);
      const activeNote = activeNoteId ? store.find(activeNoteId) : null;

      elements.noteList.innerHTML = "";

      visibleNotes.forEach((note) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `note-item${note.id === activeNoteId ? " active" : ""}`;
        button.setAttribute("aria-current", note.id === activeNoteId ? "true" : "false");
        button.dataset.noteId = note.id;
        button.innerHTML = `
          <span class="note-item-title"></span>
          <span class="note-item-preview"></span>
          <span class="note-item-date"></span>
        `;
        button.querySelector(".note-item-title").textContent = getNoteTitle(note);
        button.querySelector(".note-item-preview").textContent = getPreview(note);
        button.querySelector(".note-item-date").textContent = formatDate(note.updatedAt);
        elements.noteList.append(button);
      });

      elements.emptyState.hidden = Boolean(activeNote);
      elements.editorPanel.hidden = !activeNote;

      if (activeNote) {
        elements.noteTitle.value = activeNote.title;
        elements.noteContent.value = activeNote.content;
      }
    }

    function saveActiveNote() {
      if (!activeNoteId) return;
      store.update(activeNoteId, {
        title: elements.noteTitle.value,
        content: elements.noteContent.value,
      });
      elements.savedState.textContent = "已保存";
      render();
    }

    elements.addButton.addEventListener("click", () => {
      const note = store.add({ title: "未命名笔记", content: "" });
      activeNoteId = note.id;
      elements.searchInput.value = "";
      render();
      elements.noteTitle.focus();
      elements.noteTitle.select();
    });

    elements.deleteButton.addEventListener("click", () => {
      if (!activeNoteId) return;
      const confirmed = window.confirm("确定删除这条笔记吗？");
      if (!confirmed) return;
      store.remove(activeNoteId);
      activeNoteId = store.all()[0]?.id || null;
      render();
    });

    elements.noteList.addEventListener("click", (event) => {
      const item = event.target.closest(".note-item");
      if (!item) return;
      activeNoteId = item.dataset.noteId;
      render();
    });

    elements.searchInput.addEventListener("input", render);
    elements.noteTitle.addEventListener("input", saveActiveNote);
    elements.noteContent.addEventListener("input", saveActiveNote);

    render();

    return { store, render };
  }

  if (typeof document !== "undefined") {
    initApp(document, window.localStorage);
  }

  return {
    STORAGE_KEY,
    createNote,
    createStore,
    filterNotes,
    getNoteTitle,
    getPreview,
    sortNotes,
  };
});
