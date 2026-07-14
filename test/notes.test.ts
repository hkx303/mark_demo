import { describe, expect, it } from "vitest";
import {
  createNote,
  filterNotes,
  getDefaultAppData,
  getNoteTitle,
  getPreview,
  normalizeAppData,
  removeNote,
  sortNotes,
  updateNote,
} from "../src/shared/notes";

describe("note domain logic", () => {
  it("creates, updates, deletes, and sorts notes", () => {
    const oldNote = {
      ...createNote("旧笔记", "旧内容"),
      id: "old",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const newNote = {
      ...createNote("新笔记", "新内容"),
      id: "new",
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    expect(sortNotes([oldNote, newNote]).map((note) => note.id)).toEqual(["new", "old"]);

    const updatedNotes = updateNote([oldNote, newNote], "old", { title: "会议纪要", content: "已完成测试计划" });
    expect(updatedNotes.find((note) => note.id === "old")).toMatchObject({
      title: "会议纪要",
      content: "已完成测试计划",
    });

    expect(removeNote(updatedNotes, "new").map((note) => note.id)).toEqual(["old"]);
  });

  it("searches title and content case-insensitively", () => {
    const notes = [
      { ...createNote("Shopping", "Milk"), id: "1", updatedAt: "2026-01-01T00:00:00.000Z" },
      { ...createNote("工作", "Review HTML app"), id: "2", updatedAt: "2026-01-02T00:00:00.000Z" },
    ];

    expect(filterNotes(notes, "html").map((note) => note.id)).toEqual(["2"]);
    expect(filterNotes(notes, "shop").map((note) => note.id)).toEqual(["1"]);
  });

  it("uses readable fallback text for empty title and content", () => {
    const note = { title: "   ", content: "  \n  " };

    expect(getNoteTitle(note)).toBe("未命名笔记");
    expect(getPreview(note)).toBe("暂无内容");
  });

  it("falls back to a welcome note when persisted data is invalid", () => {
    expect(normalizeAppData({ notes: "bad", theme: "bad" })).toMatchObject({
      theme: "light",
    });
    expect(normalizeAppData({ notes: "bad", theme: "bad" }).notes[0].id).toBe("welcome-note");
    expect(getDefaultAppData().notes[0].title).toBe("欢迎使用清记");
  });
});
