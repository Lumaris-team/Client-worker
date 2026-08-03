import { getClient, getFolderIfExists, getOrCreateFolder, megaRead, megaWrite, megaDelete } from "./mega.js";

const STUDY_NOTES_ROOT = "study-notes";

// Initialize the folder architecture on first load
export async function initializeStudyNotesArchitecture(env) {
  try {
    const storage = await getClient(env);
    console.log('Initializing study-notes folder architecture...');
    
    // Create the root "study-notes" folder if it doesn't exist
    await getOrCreateFolder(storage, STUDY_NOTES_ROOT);
    
    console.log('Study-notes folder architecture initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing study-notes folder architecture:', error);
    throw error;
  }
}

function normalizePath(path) {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  return normalized || "";
}

function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function listDirectory(env, relativePath = "") {
  console.log('[listDirectory] START:', relativePath);
  const storage = await getClient(env);
  console.log('[listDirectory] Storage obtained');
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  console.log('[listDirectory] Full path:', fullPath);
  
  try {
    const folder = await getFolderIfExists(storage, fullPath);
    console.log('[listDirectory] Folder obtained:', !!folder);
    if (!folder) {
      return { files: [], folders: [], path: relativePath };
    }

    console.log('[listDirectory] Calling filter()');
    const children = await folder.filter(() => true);
    console.log('[listDirectory] Children count:', children.length);
    
    const files = [];
    const folders = [];
    let count = 0;
    const MAX_ITEMS = 5;

    for (const child of children) {
      if (count >= MAX_ITEMS) break;
      
      const item = {
        name: child.name,
        path: relativePath ? `${relativePath}/${child.name}` : child.name,
        size: child.size || 0,
        modified: child.timestamp ? formatDate(child.timestamp) : "",
        extension: child.directory ? "" : getFileExtension(child.name)
      };

      if (child.directory) {
        folders.push(item);
      } else {
        files.push(item);
      }
      count++;
    }

    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    console.log('[listDirectory] END:', { files: files.length, folders: folders.length });
    return { files, folders, path: relativePath, truncated: count >= MAX_ITEMS };
  } catch (e) {
    console.error('[listDirectory] ERROR:', e.message);
    return { files: [], folders: [], path: relativePath };
  }
}

async function readFile(env, relativePath) {
  console.log('[readFile] START:', relativePath);
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  const storage = await getClient(env);
  console.log('[readFile] Storage obtained');
  
  try {
    console.log('[readFile] Calling megaRead');
    const fileInfo = await megaRead(env, fullPath, storage);
    console.log('[readFile] FileInfo obtained:', !!fileInfo);
    if (fileInfo) {
      return { success: true, url: fileInfo.url, name: fileInfo.name, size: fileInfo.size };
    }
    return { success: false, error: "File not found" };
  } catch (e) {
    console.error('[readFile] ERROR:', e.message);
    return { success: false, error: "File not found" };
  }
}

async function writeFile(env, relativePath, content = null, url = null, fileData = null) {
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  const storage = await getClient(env);
  
  console.log(`writeFile called: path=${fullPath}, hasFile=${!!fileData}`);
  
  // If file data is provided (FormData upload), stream to MEGA
  if (fileData) {
    return await uploadFromBuffer(env, relativePath, fileData, storage);
  }
  
  // If URL is provided, use streaming upload from URL
  if (url) {
    return await uploadFromURL(env, relativePath, url, storage);
  }
  
  // Otherwise, use traditional content upload
  console.log(`writeFile called: path=${fullPath}, content length=${typeof content === 'string' ? content.length : 'unknown'}`);
  
  // Ensure parent folder exists
  const segments = fullPath.split("/").filter(Boolean);
  if (segments.length > 1) {
    const folderPath = segments.slice(0, -1).join("/");
    await getOrCreateFolder(storage, folderPath);
  }

  // Decode base64 content if it's a data URL
  let actualContent = content;
  if (typeof content === 'string' && content.startsWith('data:')) {
    const base64Data = content.split(',')[1];
    actualContent = Buffer.from(base64Data, 'base64').toString('utf8');
    console.log(`Decoded base64 content, new length: ${actualContent.length}`);
  }

  const result = await megaWrite(env, fullPath, actualContent, storage);
  return { success: true, url: result.url, name: result.name, size: result.size };
}

// Helper function to upload from URL
async function uploadFromURL(env, relativePath, url, storage = null) {
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  const storageInstance = storage || await getClient(env);
  
  console.log(`uploadFromURL called: path=${fullPath}, url=${url}`);
  
  // Ensure parent folder exists
  const segments = fullPath.split("/").filter(Boolean);
  if (segments.length > 1) {
    const folderPath = segments.slice(0, -1).join("/");
    await getOrCreateFolder(storageInstance, folderPath);
  }

  // Get file info from URL to determine name and size
  const fileName = segments.at(-1);
  const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";
  
  const folder = folderPath ? await getOrCreateFolder(storageInstance, folderPath) : storageInstance.root;
  
  // Download from URL and get file size
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download from URL: ${response.status}`);
  }
  
  const fileSize = parseInt(response.headers.get('content-length')) || 0;
  const fileSizeMB = fileSize / 1024 / 1024;
  console.log(`File size from URL: ${fileSize} bytes (${fileSizeMB.toFixed(2)} MB)`);
  
  // Calculate dynamic chunk sizes based on file size
  let initialChunkSize = 1048576; // 1MB default
  let chunkSizeIncrement = 1048576; // 1MB increment
  let maxChunkSize = 8388608; // 8MB max
  let maxConnections = 2;
  
  // Use larger chunks for larger files
  if (fileSizeMB > 100) {
    initialChunkSize = 2097152; // 2MB
    chunkSizeIncrement = 2097152; // 2MB
    maxChunkSize = 16777216; // 16MB
    maxConnections = 3;
  } else if (fileSizeMB > 50) {
    initialChunkSize = 1048576; // 1MB
    chunkSizeIncrement = 1048576; // 1MB
    maxChunkSize = 8388608; // 8MB
    maxConnections = 2;
  }
  
  console.log(`Using chunk sizes: initial=${initialChunkSize / 1024 / 1024}MB, max=${maxChunkSize / 1024 / 1024}MB, connections=${maxConnections}`);
  
  // Calculate timeout based on file size (at least 5 minutes, more for larger files)
  const timeoutMs = Math.max(300000, fileSizeMB * 10000); // 10 seconds per MB minimum
  console.log(`Upload timeout: ${timeoutMs / 1000 / 60} minutes`);
  
  // Create upload stream from MEGA
  const uploadStream = folder.upload({ 
    name: fileName,
    size: fileSize,
    maxConnections: maxConnections,
    initialChunkSize: initialChunkSize,
    chunkSizeIncrement: chunkSizeIncrement,
    maxChunkSize: maxChunkSize,
    handleRetries: (tries, error, cb) => {
      console.log(`MEGA upload retry ${tries}/12, error:`, error.message);
      if (tries > 12) {
        cb(error);
      } else {
        const delay = 2000 * Math.pow(2, tries);
        console.log(`Retrying upload in ${delay / 1000}s...`);
        setTimeout(cb, delay);
      }
    }
  });
  
  // Read from URL response and write to upload stream
  const reader = response.body.getReader();
  let totalBytesRead = 0;
  let lastProgressLog = Date.now();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        uploadStream.end();
        break;
      }
      
      const canContinueWriting = uploadStream.write(Buffer.from(value));
      
      if (!canContinueWriting) {
        await new Promise(resolve => {
          uploadStream.once('drain', resolve);
        });
      }
      
      totalBytesRead += value.length;
      
      if (fileSizeMB > 10 && Date.now() - lastProgressLog > 10000) {
        const progress = fileSize > 0 ? ((totalBytesRead / fileSize) * 100).toFixed(1) : 'unknown';
        console.log(`Download/upload progress: ${progress}% (${(totalBytesRead / 1024 / 1024).toFixed(2)} MB / ${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        lastProgressLog = Date.now();
      }
    }
    
    const file = await Promise.race([
      uploadStream.complete,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timeout after ${timeoutMs / 1000 / 60} minutes`)), timeoutMs)
      )
    ]);
    
    console.log(`Successfully uploaded file from URL: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return {
      name: file.name,
      size: file.size,
      nodeId: file.nodeId,
      downloadId: file.downloadId
    };
  } catch (error) {
    console.error(`MEGA streaming upload error:`, error);
    throw error;
  }
}

// Helper function to upload from buffer (FormData upload)
async function uploadFromBuffer(env, relativePath, fileData, storage = null) {
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  const storageInstance = storage || await getClient(env);
  
  console.log(`uploadFromBuffer called: path=${fullPath}, size=${fileData.length} bytes (${(fileData.length / 1024 / 1024).toFixed(2)} MB)`);
  
  // Ensure parent folder exists
  const segments = fullPath.split("/").filter(Boolean);
  if (segments.length > 1) {
    const folderPath = segments.slice(0, -1).join("/");
    await getOrCreateFolder(storageInstance, folderPath);
  }

  const fileName = segments.at(-1);
  const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";
  
  const folder = folderPath ? await getOrCreateFolder(storageInstance, folderPath) : storageInstance.root;
  
  // Calculate dynamic chunk sizes based on file size
  const fileSizeMB = fileData.length / 1024 / 1024;
  let initialChunkSize = 1048576; // 1MB default
  let chunkSizeIncrement = 1048576; // 1MB increment
  let maxChunkSize = 8388608; // 8MB max
  let maxConnections = 2;
  
  if (fileSizeMB > 100) {
    initialChunkSize = 2097152; // 2MB
    chunkSizeIncrement = 2097152; // 2MB
    maxChunkSize = 16777216; // 16MB
    maxConnections = 3;
  } else if (fileSizeMB > 50) {
    initialChunkSize = 1048576; // 1MB
    chunkSizeIncrement = 1048576; // 1MB
    maxChunkSize = 8388608; // 8MB
    maxConnections = 2;
  }
  
  console.log(`Using chunk sizes: initial=${initialChunkSize / 1024 / 1024}MB, max=${maxChunkSize / 1024 / 1024}MB, connections=${maxConnections}`);
  
  const timeoutMs = Math.max(300000, fileSizeMB * 10000);
  console.log(`Upload timeout: ${timeoutMs / 1000 / 60} minutes`);
  
  const uploadStream = folder.upload({ 
    name: fileName,
    size: fileData.length,
    maxConnections: maxConnections,
    initialChunkSize: initialChunkSize,
    chunkSizeIncrement: chunkSizeIncrement,
    maxChunkSize: maxChunkSize,
    handleRetries: (tries, error, cb) => {
      console.log(`MEGA upload retry ${tries}/12, error:`, error.message);
      if (tries > 12) {
        cb(error);
      } else {
        const delay = 2000 * Math.pow(2, tries);
        console.log(`Retrying upload in ${delay / 1000}s...`);
        setTimeout(cb, delay);
      }
    }
  });
  
  const chunkSize = initialChunkSize;
  let offset = 0;
  let lastProgressLog = Date.now();
  
  try {
    while (offset < fileData.length) {
      const chunk = fileData.slice(offset, offset + chunkSize);
      const canContinueWriting = uploadStream.write(chunk);
      
      if (!canContinueWriting) {
        await new Promise(resolve => {
          uploadStream.once('drain', resolve);
        });
      }
      
      offset += chunkSize;
      
      if (fileSizeMB > 10 && Date.now() - lastProgressLog > 10000) {
        const progress = ((offset / fileData.length) * 100).toFixed(1);
        console.log(`Upload progress: ${progress}% (${(offset / 1024 / 1024).toFixed(2)} MB / ${(fileData.length / 1024 / 1024).toFixed(2)} MB)`);
        lastProgressLog = Date.now();
      }
    }
    
    uploadStream.end();
    
    const file = await Promise.race([
      uploadStream.complete,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timeout after ${timeoutMs / 1000 / 60} minutes`)), timeoutMs)
      )
    ]);
    
    console.log(`Successfully uploaded file from buffer: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return {
      name: file.name,
      size: file.size,
      nodeId: file.nodeId,
      downloadId: file.downloadId
    };
  } catch (error) {
    console.error(`MEGA buffer upload error:`, error);
    throw error;
  }
}

async function deleteFile(env, relativePath) {
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  
  try {
    await megaDelete(env, fullPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: "File not found" };
  }
}

async function deleteFolder(env, relativePath) {
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  const storage = await getClient(env);
  
  try {
    const folder = await getFolderIfExists(storage, fullPath);
    if (!folder) {
      return { success: false, error: "Folder not found" };
    }
    
    await folder.delete();
    return { success: true };
  } catch (e) {
    if (e.message.includes("File not found") || e.message.includes("Folder not found")) {
      return { success: false, error: "Folder not found" };
    }
    throw e;
  }
}

async function renameItem(env, oldPath, newName) {
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${oldPath}`);
  const storage = await getClient(env);
  
  console.log(`renameItem called: oldPath=${fullPath}, newName=${newName}`);
  
  const segments = fullPath.split("/").filter(Boolean);
  const oldName = segments.at(-1);
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";
  
  const parent = parentPath ? await getFolderIfExists(storage, parentPath) : storage.root;
  
  if (!parent) {
    throw new Error("Parent folder not found");
  }
  
  const children = await parent.children;
  const item = children.find(child => child.name === oldName);
  
  if (!item) {
    throw new Error("Item not found");
  }
  
  await item.rename(newName);
  
  console.log(`Successfully renamed item from ${oldName} to ${newName}`);
  return { success: true };
}

async function createFolder(env, relativePath) {
  const storage = await getClient(env);
  const fullPath = normalizePath(`${STUDY_NOTES_ROOT}/${relativePath}`);
  
  await getOrCreateFolder(storage, fullPath);
  return { success: true };
}

export async function StudyNotesFunction(env, path, method, body) {

  switch (method) {
    case "GET":
      if (path === "" || path === "/") {
        return await listDirectory(env, "");
      }
      if (path.startsWith("list/")) {
        const relativePath = decodeURIComponent(path.slice("list/".length));
        return await listDirectory(env, relativePath);
      }
      if (path.startsWith("read/")) {
        const relativePath = decodeURIComponent(path.slice("read/".length));
        return await readFile(env, relativePath);
      }
      throw new Error("Invalid GET path");
    
    case "POST":
      if (path === "upload") {
        if (body instanceof FormData) {
          const file = body.get('file');
          const relativePath = body.get('relativePath');
          
          if (!relativePath) {
            throw new Error("relativePath is required");
          }
          if (!file) {
            throw new Error("file is required");
          }
          
          const arrayBuffer = await file.arrayBuffer();
          const fileData = Buffer.from(arrayBuffer);
          
          return await writeFile(env, relativePath, null, null, fileData);
        } else {
          const { relativePath, content, url } = body;
          if (!relativePath) {
            throw new Error("relativePath is required");
          }
          if (!content && !url) {
            throw new Error("content or url is required");
          }
          return await writeFile(env, relativePath, content, url);
        }
      }
      if (path === "folder") {
        const { relativePath } = body;
        if (!relativePath) {
          throw new Error("relativePath is required");
        }
        return await createFolder(env, relativePath);
      }
      if (path === "rename") {
        const { oldPath, newName } = body;
        if (!oldPath || !newName) {
          throw new Error("oldPath and newName are required");
        }
        return await renameItem(env, oldPath, newName);
      }
      throw new Error("Invalid POST path");
    
    case "DELETE":
      if (path.startsWith("delete/")) {
        const relativePath = decodeURIComponent(path.slice("delete/".length));
        return await deleteFile(env, relativePath);
      }
      if (path.startsWith("folder/")) {
        const relativePath = decodeURIComponent(path.slice("folder/".length));
        return await deleteFolder(env, relativePath);
      }
      throw new Error("Invalid DELETE path");
    
    default:
      throw new Error("Method not allowed");
  }
}
