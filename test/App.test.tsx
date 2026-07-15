import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/renderer/App";
import { AppData, Note } from "../src/shared/notes";

function note(overrides: Partial<Note>): Note {
  return {
    id: "note-1",
    title: "欢迎使用清记",
    content: "在左侧新建或搜索笔记，在右侧编辑标题和正文。",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mockApi(initialData: AppData) {
  let data = initialData;
  const api = {
    loadAppData: vi.fn(async () => data),
    saveAppData: vi.fn(async (nextData: AppData) => {
      data = nextData;
      return data;
    }),
  };

  Object.defineProperty(window, "qingji", {
    value: api,
    configurable: true,
  });

  return api;
}

async function renderReady(initialData: AppData) {
  const api = mockApi(initialData);
  render(<App />);
  await screen.findByRole("heading", { name: "清记" });
  return api;
}

describe("App", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    Reflect.deleteProperty(window, "qingji");
    vi.restoreAllMocks();
  });

  it("loads and renders the welcome note", async () => {
    await renderReady({
      theme: "light",
      notes: [note({ id: "welcome-note", title: "欢迎使用清记" })],
    });

    expect(screen.getByRole("button", { name: /欢迎使用清记/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("标题")).toHaveValue("欢迎使用清记");
    expect(screen.getByLabelText("内容")).toHaveValue("在左侧新建或搜索笔记，在右侧编辑标题和正文。");
  });

  it("creates a note, selects it, and saves edits", async () => {
    const user = userEvent.setup();
    const api = await renderReady({
      theme: "light",
      notes: [note({ id: "welcome-note", title: "欢迎使用清记" })],
    });

    await user.click(screen.getByRole("button", { name: "新建笔记" }));
    expect(screen.getByLabelText("标题")).toHaveValue("未命名笔记");

    await user.clear(screen.getByLabelText("标题"));
    await user.type(screen.getByLabelText("标题"), "会议纪要");
    await user.type(screen.getByLabelText("内容"), "讨论测试计划");

    await waitFor(() => {
      const savedPayloads = api.saveAppData.mock.calls.map(([payload]) => payload);
      expect(savedPayloads.some((payload) => payload.notes.some((savedNote) => savedNote.title === "会议纪要"))).toBe(true);
      expect(savedPayloads.some((payload) => payload.notes.some((savedNote) => savedNote.content.includes("讨论测试计划")))).toBe(
        true,
      );
    });
  });

  it("filters notes by title and content", async () => {
    const user = userEvent.setup();
    await renderReady({
      theme: "light",
      notes: [
        note({ id: "shopping", title: "Shopping", content: "Milk", updatedAt: "2026-01-01T00:00:00.000Z" }),
        note({ id: "work", title: "工作", content: "Review HTML app", updatedAt: "2026-01-02T00:00:00.000Z" }),
      ],
    });

    await user.type(screen.getByPlaceholderText("搜索标题或内容"), "html");

    const list = screen.getByRole("navigation", { name: "全部笔记" });
    expect(within(list).getByRole("button", { name: /工作/ })).toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: /Shopping/ })).not.toBeInTheDocument();
  });

  it("deletes the selected note after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const api = await renderReady({
      theme: "light",
      notes: [
        note({ id: "first", title: "第一条", updatedAt: "2026-01-02T00:00:00.000Z" }),
        note({ id: "second", title: "第二条", updatedAt: "2026-01-01T00:00:00.000Z" }),
      ],
    });

    await user.click(screen.getByRole("button", { name: "删除" }));

    expect(confirmSpy).toHaveBeenCalledWith("确定删除这条笔记吗？");
    await waitFor(() => {
      expect(api.saveAppData).toHaveBeenLastCalledWith({
        theme: "light",
        notes: [expect.objectContaining({ id: "second" })],
      });
    });
    expect(screen.queryByRole("button", { name: /第一条/ })).not.toBeInTheDocument();
  });

  it("toggles and saves the theme", async () => {
    const user = userEvent.setup();
    const api = await renderReady({
      theme: "light",
      notes: [note({ id: "welcome-note" })],
    });

    await user.click(screen.getByRole("button", { name: "切换到深色模式" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(api.saveAppData).toHaveBeenLastCalledWith({
      theme: "dark",
      notes: [expect.objectContaining({ id: "welcome-note" })],
    });
  });

  it("shows a startup error instead of a blank page when the Electron bridge is missing", async () => {
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("桌面桥接加载失败");
    expect(screen.getByText("请先执行 npm run build，再执行 npm run dev。")).toBeInTheDocument();
  });
});
