import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const targetPath = join("dist-electron", "electron", "preload.cjs");

await mkdir(dirname(targetPath), { recursive: true });
await copyFile(join("electron", "preload.cjs"), targetPath);
