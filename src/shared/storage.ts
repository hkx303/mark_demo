import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AppData, getDefaultAppData, normalizeAppData } from "./notes.js";

const DATA_FILE = "qingji-data.json";

export function getDataFilePath(userDataPath: string): string {
  return join(userDataPath, DATA_FILE);
}

export async function loadAppData(userDataPath: string): Promise<AppData> {
  const dataPath = getDataFilePath(userDataPath);

  try {
    const rawData = await readFile(dataPath, "utf8");
    return normalizeAppData(JSON.parse(rawData));
  } catch {
    return getDefaultAppData();
  }
}

export async function saveAppData(userDataPath: string, data: AppData): Promise<AppData> {
  const normalizedData = normalizeAppData(data);
  const dataPath = getDataFilePath(userDataPath);

  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(normalizedData, null, 2)}\n`, "utf8");

  return normalizedData;
}
