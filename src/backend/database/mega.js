import { Storage } from "megajs";

// Cache des connexions pour éviter trop de logins
const connectionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures pour éviter les blocages MEGA (credential stuffing)
const MAX_CACHE_SIZE = 1; // Maximum 1 connexion simultanée
const MIN_OPERATION_DELAY = 2000; // Délai minimum entre opérations (ms) - augmenté pour éviter le throttling MEGA
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
  const email = env.MEGA_EMAIL;
  const password = env.MEGA_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing MEGA_EMAIL or MEGA_PASSWORD");
  }

  const cacheKey = email;
  const cached = connectionCache.get(cacheKey);
  
  // Vérifier si la connexion est encore valide (sauf si forceRefresh)
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached MEGA connection');
    return cached.storage;
  }

  // Nettoyer le cache si trop d'entrées ou si forceRefresh
  if (forceRefresh || connectionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = connectionCache.keys().next().value;
    connectionCache.delete(oldestKey);
    console.log('Cleared MEGA connection cache');
  }

  // Créer une nouvelle connexion avec optimisations pour éviter le blocage MEGA
  const storage = new Storage({ 
    email, 
    password,
    userAgent: getRandomUserAgent(), // UserAgent aléatoire de navigateur réel pour éviter suspicion
    keepalive: true, // Activé pour éviter les reconnexions fréquentes
    autoload: true, // Activé pour s'assurer que root est disponible
    autologin: true, // Garder le login automatique
    autofetch: true, // Activer le fetch automatique
    protocol: "https", // Utiliser HTTPS sécurisé
    host: "g.api.mega.co.nz", // Serveur MEGA standard
    port: 443, // Port HTTPS standard
  });
  
  await withTimeout(storage.ready, 15000, "Mega login timed out");
  
  // Attendre un peu plus que root soit chargé si autoload est activé
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Vérifier que root est disponible
  if (!storage.root) {
    throw new Error("Storage root not available after login");
  }
  
  // Mettre en cache
  connectionCache.set(cacheKey, {
    storage,
    timestamp: Date.now()
  });
  
  return storage;
}

export async function getOrCreateFolder(storage, folderPath) {
  const normalized = normalizePath(folderPath);
  if (!normalized) return storage.root;

  const segments = normalized.split("/").filter(Boolean);
  let current = storage.root;

  if (!current) {
    throw new Error("Storage root not available");
  }

  for (const segment of segments) {
    await withDelay();
    const children = await withTimeout(
      current.children, 
      2000, 
      `Children loading timeout for ${segment}` 
    );
    
    let folder = children.find(child => child.name === segment && child.directory);
    if (!folder) {
      await withDelay();
      folder = await withTimeout(
        current.mkdir(segment), 
        2000, 
        `Mkdir timeout for ${segment}` 
      );
    }
    current = folder;
    
    if (!current) {
      throw new Error(`Failed to navigate to folder: ${segment}`);
    }
  }

  return current;
}

export async function getFolderIfExists(storage, folderPath) {
  const normalized = normalizePath(folderPath);
  if (!normalized) return storage.root;

  const segments = normalized.split("/").filter(Boolean);
  let current = storage.root;

  if (!current) {
    throw new Error("Storage root not available");
  }

  for (const segment of segments) {
    await withDelay();
    const children = await withTimeout(
      current.children, 
      2000, 
      `Children loading timeout for ${segment}` 
    );
    
    const folder = children.find(child => child.name === segment && child.directory);
    if (!folder) return null;
    current = folder;
    
    if (!current) {
      return null;
    }
  }

  return current;
}

async function ensureParentFolder(storage, path) {
  const normalized = normalizePath(path);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length <= 1) return null;
  const folderPath = segments.slice(0, -1).join("/");
  return await getOrCreateFolder(storage, folderPath);
}

export async function megaRead(env, path, storage = null, forceRefresh = false) {
  const fullPath = `lumaris/${normalizePath(path)}`;

  return await retryOperation(async () => {
    await withDelay();
    const storageInstance = storage || await getClient(env, forceRefresh);

    try {
      const file = storageInstance.root.navigate(fullPath);
      if (file && !file.directory) {
        console.log(`Reading file via navigate: ${fullPath}`);
        const buffer = await withTimeout(
          file.downloadBuffer({
            maxConnections: 1,
            initialChunkSize: 65536,
            chunkSizeIncrement: 65536,
            maxChunkSize: 524288,
          }), 
          10000, 
          `Mega download timed out for ${fullPath}` 
        );
        const text = Buffer.from(buffer).toString("utf8");
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    } catch (e) {
      console.log(`Navigate failed, using manual method for: ${fullPath}`);
    }

    const segments = fullPath.split("/").filter(Boolean);
    const fileName = segments.at(-1);
    const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";

    const folder = folderPath ? await getFolderIfExists(storageInstance, folderPath) : storageInstance.root;
    if (!folder) {
      console.log(`Folder not found for ${fullPath}, creating with empty content`);
      const newFolder = await getOrCreateFolder(storageInstance, folderPath);
      await megaWrite(env, path, "", newFolder);
      return "";
    }

    const children = await withTimeout(
      folder.children, 
      2000, 
      `Children loading timeout for ${fullPath}` 
    );
    
    const fileNodes = children.filter(child => child.name === fileName && !child.directory);
    console.log(`Found ${fileNodes.length} files with name: ${fileName}`);
    
    if (fileNodes.length === 0) {
      console.log(`File not found for ${fullPath}, creating with empty content`);
      await megaWrite(env, path, "", folder);
      return "";
    }
    
    const fileNode = fileNodes[0];
    console.log(`Reading file node: ${fileNode.name}`);

    const buffer = await withTimeout(
      fileNode.downloadBuffer({
        maxConnections: 1,
        initialChunkSize: 65536,
        chunkSizeIncrement: 65536,
        maxChunkSize: 524288,
      }), 
      10000, 
      `Mega download timed out for ${fullPath}` 
    );
    const text = Buffer.from(buffer).toString("utf8");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }, 1, 5000, 100);
}

export async function megaWrite(env, path, body, storage = null) {
  const fullPath = `lumaris/${normalizePath(path)}`;
  const content = Buffer.from(toText(body), "utf8");

  return await retryOperation(async () => {
    await withDelay();
    const storageInstance = storage || await getClient(env);

    const segments = fullPath.split("/").filter(Boolean);
    const fileName = segments.at(-1);
    const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";

    console.log(`Starting upload for: ${fullPath}, size: ${content.length} bytes`);

    const folder = folderPath ? await getOrCreateFolder(storageInstance, folderPath) : storageInstance.root;
    
    const children = await withTimeout(
      folder.children, 
      2000, 
      `Children loading timeout for ${fullPath}` 
    );
    
    const existingFiles = children.filter(child => child.name === fileName && !child.directory);
    console.log(`Found ${existingFiles.length} existing files with name: ${fileName}`);
    
    for (const existing of existingFiles) {
      try {
        console.log(`Deleting existing file: ${existing.name}`);
        await existing.delete();
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (deleteError) {
        console.error(`Error deleting file ${existing.name}:`, deleteError);
      }
    }

    const uploadPromise = new Promise((resolve, reject) => {
      folder.upload({ 
        name: fileName, 
        size: content.length,
        maxConnections: 1,
        initialChunkSize: 65536,
        chunkSizeIncrement: 65536,
        maxChunkSize: 524288,
        handleRetries: (tries, error, cb) => {
          console.log(`MEGA upload retry ${tries}/8, error:`, error.message);
          if (tries > 8) {
            cb(error);
          } else {
            const delay = 1000 * Math.pow(2, tries);
            console.log(`Retrying upload in ${delay}ms...`);
            setTimeout(cb, delay);
          }
        }
      }, content, (err, file) => {
        if (err) {
          console.error(`MEGA upload error:`, err);
          reject(err);
        } else {
          console.log(`MEGA upload complete: ${file.name}`);
          resolve(file);
        }
      });
    });

    const file = await withTimeout(uploadPromise, 60000, `Mega upload timed out for ${fullPath}`);
    console.log(`Successfully uploaded file: ${file.name}`);
    return {
      name: file.name,
      size: file.size,
      nodeId: file.nodeId,
      downloadId: file.downloadId
    };
  }, 5, 120000, 2000);
}

export async function megaDelete(env, path) {
  const fullPath = `lumaris/${normalizePath(path)}`;

  return await retryOperation(async () => {
    await withDelay();
    const storage = await getClient(env);

    const segments = fullPath.split("/").filter(Boolean);
    const fileName = segments.at(-1);
    const folderPath = segments.length > 1 ? segments.slice(0, -1).join("/") : "";

    const folder = folderPath ? await getFolderIfExists(storage, folderPath) : storage.root;
    if (!folder) {
      return { deleted: false };
    }

    const children = await withTimeout(
      folder.children, 
      2000, 
      `Children loading timeout for ${fullPath}` 
    );
    
    const existing = children.find(child => child.name === fileName && !child.directory);
    if (!existing) return { deleted: false };
    await existing.delete();
    return { deleted: true };
  }, 1, 5000, 100);
}
