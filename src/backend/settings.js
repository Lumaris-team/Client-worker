import { getCacheValue, setCacheValue } from "./cache/index.js";

const SETTINGS_PREFIX = "settings_";

function normalizePath(path) {
  return path.replace(/^\/+/, "");
}

export async function SettingsFunction(env, path, method, body, sessionPayload) {
  const key = `${SETTINGS_PREFIX}${sessionPayload?.sub ?? sessionPayload?.email ?? "anonymous"}`;
  const subpath = normalizePath(path || "");

  if (subpath && subpath !== "/") {
    return { error: "unknown_settings_route" };
  }

  if (method === "GET") {
    const saved = await getCacheValue(key);
    return { settings: saved ?? null };
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const settings = body?.settings ?? body;
    await setCacheValue(key, settings ?? {});
    return { settings: settings ?? null };
  }

  return { error: "method_not_allowed" };
}
