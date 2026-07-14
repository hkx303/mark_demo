import { useEffect, useMemo, useState } from "react";
import {
  AppData,
  Note,
  Theme,
  createNote,
  filterNotes,
  getDefaultAppData,
  getNoteTitle,
  getPreview,
  removeNote,
  sortNotes,
  updateNote,
} from "../shared/notes";

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [savedState, setSavedState] = useState("已保存");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    window.qingji
      .loadAppData()
      .catch(() => getDefaultAppData())
      .then((data) => {
        if (!isMounted) return;
        const orderedNotes = sortNotes(data.notes);
        setNotes(orderedNotes);
        setTheme(data.theme);
        setActiveNoteId(orderedNotes[0]?.id ?? null);
        setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const visibleNotes = useMemo(() => filterNotes(notes, query), [notes, query]);
  const activeNote = activeNoteId ? notes.find((note) => note.id === activeNoteId) ?? null : null;

  function persist(nextData: AppData) {
    setSavedState("保存中...");
    window.qingji
      .saveAppData(nextData)
      .then((savedData) => {
        setNotes(sortNotes(savedData.notes));
        setTheme(savedData.theme);
        setSavedState("已保存");
      })
      .catch(() => {
        setSavedState("保存失败");
      });
  }

  function handleAddNote() {
    const note = createNote();
    const nextNotes = sortNotes([note, ...notes]);
    setNotes(nextNotes);
    setActiveNoteId(note.id);
    setQuery("");
    persist({ notes: nextNotes, theme });
  }

  function handleDeleteNote() {
    if (!activeNoteId) return;
    const confirmed = window.confirm("确定删除这条笔记吗？");
    if (!confirmed) return;

    const nextNotes = sortNotes(removeNote(notes, activeNoteId));
    setNotes(nextNotes);
    setActiveNoteId(nextNotes[0]?.id ?? null);
    persist({ notes: nextNotes, theme });
  }

  function handleNoteInput(changes: Pick<Note, "title" | "content">) {
    if (!activeNoteId) return;
    const nextNotes = sortNotes(updateNote(notes, activeNoteId, changes));
    setNotes(nextNotes);
    persist({ notes: nextNotes, theme });
  }

  function handleThemeToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    persist({ notes, theme: nextTheme });
  }

  if (!isReady) {
    return (
      <main className="app-shell loading-shell" aria-label="笔记软件">
        <p>正在加载...</p>
      </main>
    );
  }

  return (
    <main className="app-shell" aria-label="笔记软件">
      <aside className="sidebar" aria-label="笔记列表">
        <header className="sidebar-header">
          <div>
            <p className="eyebrow">Notes</p>
            <h1>清记</h1>
          </div>
          <button className="icon-button primary" type="button" title="新建笔记" aria-label="新建笔记" onClick={handleAddNote}>
            +
          </button>
        </header>

        <label className="search-box" htmlFor="searchInput">
          <span aria-hidden="true">⌕</span>
          <input
            id="searchInput"
            type="search"
            placeholder="搜索标题或内容"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <nav className="note-list" aria-label="全部笔记">
          {visibleNotes.map((note) => (
            <button
              className={`note-item${note.id === activeNoteId ? " active" : ""}`}
              type="button"
              key={note.id}
              aria-current={note.id === activeNoteId ? "true" : "false"}
              onClick={() => setActiveNoteId(note.id)}
            >
              <span className="note-item-title">{getNoteTitle(note)}</span>
              <span className="note-item-preview">{getPreview(note)}</span>
              <span className="note-item-date">{formatDate(note.updatedAt)}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            aria-pressed={theme === "dark"}
            onClick={handleThemeToggle}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "dark" ? "☀" : "☾"}
            </span>
            <span className="theme-toggle-label">{theme === "dark" ? "浅色模式" : "深色模式"}</span>
            <span className="theme-toggle-switch" aria-hidden="true">
              <span className="theme-toggle-knob" />
            </span>
          </button>
        </div>
      </aside>

      <section className="editor" aria-label="笔记内容">
        {!activeNote && (
          <div className="editor-empty">
            <h2>选择或新建一条笔记</h2>
            <p>左侧列表用于管理笔记，右侧用于编辑内容。</p>
          </div>
        )}

        {activeNote && (
          <article className="editor-panel">
            <div className="editor-toolbar">
              <div className="saved-state" aria-live="polite">
                {savedState}
              </div>
              <button className="text-button danger" type="button" onClick={handleDeleteNote}>
                删除
              </button>
            </div>

            <label className="field-label" htmlFor="noteTitle">
              标题
            </label>
            <input
              className="title-input"
              id="noteTitle"
              type="text"
              maxLength={80}
              placeholder="未命名笔记"
              value={activeNote.title}
              onChange={(event) => handleNoteInput({ title: event.target.value, content: activeNote.content })}
            />

            <label className="field-label" htmlFor="noteContent">
              内容
            </label>
            <textarea
              className="content-input"
              id="noteContent"
              placeholder="记录想法、待办或会议要点"
              value={activeNote.content}
              onChange={(event) => handleNoteInput({ title: activeNote.title, content: event.target.value })}
            />
          </article>
        )}
      </section>
    </main>
  );
}
