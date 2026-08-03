import { Storage, API } from "megajs";

// Cache des connexions pour éviter trop de logins
const connectionCache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours pour éviter de recréer des connexions // 24 heures pour éviter les blocages MEGA (credential stuffing)
const MAX_CACHE_SIZE = 5; // Augmenter pour plus de flexibilité // Maximum 1 connexion simultanée
const MIN_OPERATION_DELAY = 0; // Désactivé pour optimiser
let lastOperationTime = 0; // Timestamp de la dernière opération

// Liste de user agents de navigateurs réels pour éviter la détection
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function normalizePath(path) {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  return normalized || "";
}

function toText(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

async function withDelay() {
  const now = Date.now();
  const timeSinceLastOperation = now - lastOperationTime;
  if (timeSinceLastOperation < MIN_OPERATION_DELAY) {
    const delay = MIN_OPERATION_DELAY - timeSinceLastOperation;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastOperationTime = Date.now();
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(message));
    }, ms);
  });
  
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

// Exponential backoff pour éviter les blocages
async function retryOperation(operation, attempts = 5, baseTimeoutMs = 120000, baseDelayMs = 2000) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const timeoutMs = baseTimeoutMs; // Timeout très long pour les gros fichiers
      console.log(`MEGA operation attempt ${attempt}/${attempts} with timeout ${timeoutMs}ms`);
      return await withTimeout(operation(), timeoutMs, `Mega operation timed out after ${timeoutMs}ms`);
    } catch (error) {
      lastError = error;
      const message = String(error?.message || "").toLowerCase();
      const isNotFound = message.includes("file not found") || message.includes("folder not found");
      const isRateLimit = message.includes("rate limit") || message.includes("too many requests") || message.includes("bandwidth") || message.includes("-7");
      
      if (isNotFound || attempt === attempts) {
        throw error;
      }
      
      // Exponential backoff pour rate limits et erreurs temporaires
      const delayMs = isRateLimit ? baseDelayMs * Math.pow(2, attempt) : baseDelayMs * attempt;
      console.log(`MEGA operation failed (attempt ${attempt}/${attempts}), retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export async function getClient(env, forceRefresh = false) {
  console.log('[getClient] START');
  const email = env.MEGA_EMAIL;
  const password = env.MEGA_PASSWORD;
  const cacheKey = `${email}:${password}`;

  // Réactiver le cache pour éviter de recréer des connexions (très coûteux)
  if (!forceRefresh && connectionCache.has(cacheKey)) {
    const cached = connectionCache.get(cacheKey);
    const now = Date.now();
    if (now - cached.timestamp < CACHE_TTL) {
      console.log('[getClient] Using cached connection');
      return cached.storage;
    } else {
      connectionCache.delete(cacheKey);
      console.log('[getClient] Cache expired');
    }
  }

  if (!email || !password) {
    throw new Error("MEGA_EMAIL and MEGA_PASSWORD must be set");
  }

  console.log('[getClient] Creating new Storage WITHOUT autologin');
  
  // Créer une API minimaliste pour réduire CPU
  const api = new API({
    keepalive: false, // Désactiver keepalive au niveau API
    // Autres options minimales
  });
  
  const storage = new Storage({ 
    email, 
    password,
    userAgent: getRandomUserAgent(),
    keepalive: false, // Désactiver keepalive
    autoload: false,
    autologin: false,
    api: api, // Utiliser l'API minimaliste
  });
  
  console.log('[getClient] Calling login() manuellement');
  await storage.login();
  console.log('[getClient] login() completed');
  
  // Mettre en cache
  connectionCache.set(cacheKey, {
    storage,
    timestamp: Date.now()
  });
  
  console.log('[getClient] END');
  return storage;
}

export async function getOrCreateFolder(storage, folderPath) {
  if (!folderPath) return storage.root;
  
  const segments = folderPath.split("/").filter(Boolean);
  let current = storage.root;
  
  for (const segment of segments) {
    try {
      const folder = await current.find(segment);
      if (folder && folder.directory) {
        current = folder;
      } else {
        current = await current.mkdir(segment);
      }
    } catch (e) {
      // Folder doesn't exist
      current = await current.mkdir(segment);
    }
  }

  return current;
}

export async function getFolderIfExists(storage, folderPath) {
  console.log('[getFolderIfExists] START:', folderPath);
  if (!folderPath) return storage.root;
  
  const normalized = normalizePath(folderPath);
  if (!normalized) return storage.root;

  // Utiliser find() au lieu de navigate() pour éviter l'erreur ENOENT
  try {
    const segments = normalized.split("/").filter(Boolean);
    let current = storage.root;
    console.log('[getFolderIfExists] Segments:', segments);
    
    for (const segment of segments) {
      console.log('[getFolderIfExists] Finding:', segment);
      const found = await current.find(segment);
      console.log('[getFolderIfExists] Found:', !!found);
      if (found && found.directory) {
        current = found;
      } else {
        return null;
      }
    }
    
    console.log('[getFolderIfExists] END: folder found');
    return current;
  } catch (e) {
    console.error('[getFolderIfExists] ERROR:', e.message);
    return null;
  }
}

async function ensureParentFolder(storage, path) {
  const normalized = normalizePath(path);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length <= 1) return null;
  const folderPath = segments.slice(0, -1).join("/");
  return await getOrCreateFolder(storage, folderPath);
}

export async function megaRead(env, path, storage = null, forceRefresh = false) {
  console.log('[megaRead] START:', path);
  const fullPath = `lumaris/${normalizePath(path)}`;
  const storageInstance = storage || await getClient(env, forceRefresh);

  try {
    console.log('[megaRead] Trying navigate');
    const file = storageInstance.root.navigate(fullPath);
    if (file && !file.directory) {
      console.log('[megaRead] File found via navigate, getting link');
      const link = await file.link();
      console.log('[megaRead] Link obtained');
      return { url: link, name: file.name, size: file.size };
    }
  } catch (e) {
    console.log('[megaRead] Navigate failed:', e.message);
  }

  const segments = fullPath.split("/").filter(Boolean);
  const fileName = segments.at(-1);
  const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";

  console.log('[megaRead] Getting folder:', folderPath);
  const folder = folderPath ? await getFolderIfExists(storageInstance, folderPath) : storageInstance.root;
  if (!folder) {
    console.log('[megaRead] Folder not found');
    return null;
  }

  try {
    console.log('[megaRead] Finding file:', fileName);
    const file = await folder.find(fileName);
    if (file && !file.directory) {
      console.log('[megaRead] File found, getting link');
      const link = await file.link();
      console.log('[megaRead] Link obtained');
      return { url: link, name: file.name, size: file.size };
    }
  } catch (e) {
    console.log('[megaRead] File not found:', e.message);
  }

  console.log('[megaRead] END: file not found');
  return null;
}

export async function megaWrite(env, path, body, storage = null) {
  const fullPath = `lumaris/${normalizePath(path)}`;
  const content = Buffer.from(toText(body), "utf8");
  const storageInstance = storage || await getClient(env);

  const segments = fullPath.split("/").filter(Boolean);
  const fileName = segments.at(-1);
  const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";

  const folder = folderPath ? await getOrCreateFolder(storageInstance, folderPath) : storageInstance.root;
  
  try {
    const existingFile = await folder.find(fileName);
    if (existingFile && !existingFile.directory) {
      await existingFile.delete();
    }
  } catch (e) {
    // File doesn't exist
  }

  const file = await folder.upload(fileName, content).complete;
  const link = await file.link();
  return {
    name: file.name,
    size: file.size,
    nodeId: file.nodeId,
    downloadId: file.downloadId,
    url: link
  };
}

export async function megaDelete(env, path) {
  const fullPath = `lumaris/${normalizePath(path)}`;
  const storage = await getClient(env);

  const segments = fullPath.split("/").filter(Boolean);
  const fileName = segments.at(-1);
  const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";

  const folder = folderPath ? await getFolderIfExists(storage, folderPath) : storage.root;
  if (!folder) {
    return { deleted: false };
  }

  try {
    const existing = await folder.find(fileName);
    if (existing && !existing.directory) {
      await existing.delete();
      return { deleted: true };
    }
  } catch (e) {
    // File doesn't exist
  }
  return { deleted: false };
}
