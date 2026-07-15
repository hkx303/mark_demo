import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("index.html", () => {
  it("shows a startup fallback instead of a blank page when opened directly", async () => {
    const html = await readFile(join(process.cwd(), "index.html"), "utf8");

    expect(html).toContain("startup-fallback");
    expect(html).toContain("npm run dev");
    expect(html).toContain("/src/renderer/main.tsx");
  });
});
