import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createNote } from "../src/shared/notes";
import { getDataFilePath, loadAppData, saveAppData } from "../src/shared/storage";

let tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), "qingji-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("file storage", () => {
  it("returns default app data when the data file is missing", async () => {
    const dir = await createTempDir();

    await expect(loadAppData(dir)).resolves.toMatchObject({
      theme: "light",
      notes: [{ id: "welcome-note" }],
    });
  });

  it("writes and reads notes and theme from the user data directory", async () => {
    const dir = await createTempDir();
    const note = createNote("会议纪要", "测试桌面存储");

    await saveAppData(dir, { notes: [note], theme: "dark" });

    await expect(loadAppData(dir)).resolves.toEqual({
      notes: [note],
      theme: "dark",
    });
    await expect(readFile(getDataFilePath(dir), "utf8")).resolves.toContain("会议纪要");
  });

  it("falls back safely when the JSON file is damaged", async () => {
    const dir = await createTempDir();
    await writeFile(getDataFilePath(dir), "{bad json", "utf8");

    await expect(loadAppData(dir)).resolves.toMatchObject({
      theme: "light",
      notes: [{ id: "welcome-note" }],
    });
  });
});
