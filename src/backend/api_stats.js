import { getClient, getFolderIfExists } from "./database/mega.js";

const STORAGE_PATHS = [
  { key: "files/", label: "Files" },
  { key: "study-notes/", label: "Study notes" },
];

async function getFolderSize(env, path) {
  const storage = await getClient(env);
  const folder = await getFolderIfExists(storage, path);
  if (!folder) return 0;

  let totalBytes = 0;
  for await (const child of folder.filter(() => true)) {
    if (child.directory) {
      totalBytes += await getDirectorySize(child);
    } else {
      totalBytes += child.size || 0;
    }
  }

  return totalBytes;
}

async function getDirectorySize(folder) {
  let total = 0;

  for await (const child of folder.filter(() => true)) {
    if (child.directory) {
      total += await getDirectorySize(child);
    } else {
      total += child.size || 0;
    }
  }

  return total;
}

export async function StatsFunction(env) {
  const results = [];
  let totalBytes = 0;

  for (const item of STORAGE_PATHS) {
    const size = await getFolderSize(env, item.key);
    totalBytes += size;
    results.push({
      key: item.key,
      label: item.label,
      bytes: size,
    });
  }

  return {
    aiUsage: {
      used: 12,
      limit: 20,
    },
    storage: {
      totalBytes,
      capacityGB: 20,
      items: results,
    },
  };
}
