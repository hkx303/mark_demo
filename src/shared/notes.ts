export const DEFAULT_TITLE = "未命名笔记";
export const EMPTY_PREVIEW = "暂无内容";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type Theme = "light" | "dark";

export interface AppData {
  notes: Note[];
  theme: Theme;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createNote(title = DEFAULT_TITLE, content = ""): Note {
  const timestamp = nowIso();
  return {
    id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createWelcomeNote(): Note {
  const timestamp = nowIso();
  return {
    id: "welcome-note",
    title: "欢迎使用清记",
    content: "在左侧新建或搜索笔记，在右侧编辑标题和正文。所有内容会自动保存在桌面客户端本地。",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getDefaultAppData(): AppData {
  return {
    notes: [createWelcomeNote()],
    theme: "light",
  };
}

export function getNoteTitle(note: Pick<Note, "title">): string {
  return note.title.trim() || DEFAULT_TITLE;
}

export function getPreview(note: Pick<Note, "content">): string {
  const content = note.content.trim().replace(/\s+/g, " ");
  return content || EMPTY_PREVIEW;
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function filterNotes(notes: Note[], query: string): Note[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return sortNotes(notes);

  return sortNotes(
    notes.filter((note) => {
      const searchableText = `${note.title} ${note.content}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    }),
  );
}

export function updateNote(notes: Note[], id: string, changes: Pick<Note, "title" | "content">): Note[] {
  const timestamp = nowIso();
  return notes.map((note) => (note.id === id ? { ...note, ...changes, updatedAt: timestamp } : note));
}

export function removeNote(notes: Note[], id: string): Note[] {
  return notes.filter((note) => note.id !== id);
}

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function normalizeNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) return [createWelcomeNote()];

  const notes = value.filter(isNote);
  return notes.length > 0 ? notes : [createWelcomeNote()];
}

export function normalizeAppData(value: unknown): AppData {
  if (!value || typeof value !== "object") return getDefaultAppData();

  const record = value as Record<string, unknown>;
  return {
    notes: normalizeNotes(record.notes),
    theme: isTheme(record.theme) ? record.theme : "light",
  };
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.content === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string"
  );
}
