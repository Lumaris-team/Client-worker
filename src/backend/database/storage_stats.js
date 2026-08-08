import { getClient, getFolderIfExists } from "./mega.js";

const FILES_ROOT = "files";
const STUDY_NOTES_ROOT = "study-notes";

async function getFolderSize(env, folderPath) {
  try {
    const storage = await getClient(env);
    const folder = await getFolderIfExists(storage, folderPath);
    
    if (!folder) {
      return 0;
    }

    let totalSize = 0;
    
    // Recursive function to calculate folder size
    async function calculateSize(node) {
      if (node.directory) {
        const children = await node.children;
        for (const child of children) {
          await calculateSize(child);
        }
      } else {
        totalSize += node.size || 0;
      }
    }

    await calculateSize(folder);
    return totalSize;
  } catch (error) {
    console.error(`Error calculating size for ${folderPath}:`, error);
    return 0;
  }
}

export async function getStorageStats(env) {
  try {
    // Get storage usage for files folder
    const filesBytes = await getFolderSize(env, FILES_ROOT);
    
    // Get storage usage for study-notes folder
    const notesBytes = await getFolderSize(env, STUDY_NOTES_ROOT);
    
    const totalBytes = filesBytes + notesBytes;
    
    // Default capacity (can be adjusted based on your plan)
    const capacityGB = 20;
    
    return {
      totalBytes,
      capacityGB,
      items: [
        { key: "files/", label: "lumaris/files/", bytes: filesBytes },
        { key: "study-notes/", label: "lumaris/study-notes/", bytes: notesBytes },
      ]
    };
  } catch (error) {
    console.error("Error fetching storage stats:", error);
    return {
      totalBytes: 0,
      capacityGB: 20,
      items: [
        { key: "files/", label: "lumaris/files/", bytes: 0 },
        { key: "study-notes/", label: "lumaris/study-notes/", bytes: 0 },
      ]
    };
  }
}
