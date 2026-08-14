// Workflows
import { CheckGradesWorkflow } from "./workflows/check_grades";

// API features
import { EDfunction } from "./backend/ecole_directe/index.js";
import { AIfunction } from "./backend/ai/index.js";
import { Cache } from "./backend/cache/index.js";
import { Auth, verifySessionToken } from "./backend/auth/index.js";
import { Pomodoro } from "./backend/database/pomodoro.js";
import { WebsitesFunction } from "./backend/database/websites.js";
import { FilesFunction, initializeFolderArchitecture } from "./backend/database/files_management.js";
import { StudyNotesFunction } from "./backend/database/study_notes.js";
import { ToolsFunction } from "./backend/tools/index.js";
import { StatsFunction } from "./backend/settings/stats.js";
import { CustomizationFunction } from "./backend/settings/customization.js";
  
import { sendMail } from "./backend/notifications/mail.js";

async function sendErrorEmail(env, error, context) {
  try {
    const rawError = error instanceof Error ? error.stack || error.message : String(error);
    await sendMail(env, {
      subject: `Dashboard error: ${context}`,
      text: `A runtime error occurred while processing the request in the Dashboard application.\n\nContext: ${context}\n\nRaw error:\n${rawError}`,
    });
  } catch (mailError) {
    console.error("Failed to send error email:", mailError);
  }
}

// API funtion
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const headers = request.headers
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      const formData = await request.formData();
      body = formData;
    } else {
      // Handle JSON
      try {
        body = JSON.parse(await request.text());
      } catch (e) {
        body = {};
      }
    } 
    
    // =========================
    // ⛔ BLOCK WORKERS.DEV URLS
    // =========================
    const host = url.hostname;
    if (host.includes("workers.dev")) {
      return new Response("Access denied. Use custom domain only.", { status: 403 });
    }

    // =========================
    // 📶 MAIN API
    // =========================
    /// CORS
    const corsHeaders = {
      "Content-Type":
        "application/json",

      "Access-Control-Allow-Origin":
        "*",

      "Access-Control-Allow-Methods":
        "GET, POST, DELETE, PUT, PATCH, OPTIONS",

      "Access-Control-Allow-Headers":
        "*"
    };
    
    // Public Supabase config for the frontend (anon key is public).
    if (url.pathname === "/api/config") {
      return new Response(JSON.stringify({
        supabaseUrl: env.SUPABASE_URL ?? null,
        supabaseAnonKey: env.SUPABASE_ANON_KEY ?? null,
        turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null,
      }), {
        headers: corsHeaders
      });
    }

    // Auth: verify Supabase token + issue/validate server session tokens.
    if (url.pathname.startsWith("/api/auth/")) {
      try {
        const resp = await Auth(env, url.pathname.slice("/api/auth/".length), method, body, request);
        return new Response(JSON.stringify(resp), { headers: corsHeaders });
      } catch (e) {
        console.error("AUTH ERROR:", e?.stack || e);
        await sendErrorEmail(env, e, "AUTH");
        return new Response(JSON.stringify({ valid: false, error: e?.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    if (url.pathname.startsWith("/api/")) {
      // Every data route requires a valid server-issued JWT in the
      // Authorization header. /api/config and /api/auth/* are intentionally
      // reachable without one (they bootstrap the login + token exchange), and
      // google site verification is handled earlier, before any gating.
      const authHeader = headers.get("Authorization") || "";
      const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
      const session = await verifySessionToken(env, bearer);
      if (!session.valid) {
        return new Response(JSON.stringify({ error: "unauthorized", reason: session.reason }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      try {
        // Ecole directe paths
        let resp;
        if (url.pathname.startsWith("/api/ed/")) {
          resp = await EDfunction(env, url.pathname.slice("/api/ed/".length), method, headers, body);
        } else if (url.pathname.startsWith("/api/ai/")) {
          resp = await AIfunction(env, url.pathname.slice("/api/ai/".length), method, headers, body, request);
        } else if (url.pathname.startsWith("/api/pomodoro/")) {
          resp = await Pomodoro(env, url.pathname.slice("/api/pomodoro/".length), method, body);
        } else if (url.pathname.startsWith("/api/websites/")) {
          resp = await WebsitesFunction(env, url.pathname.slice("/api/websites/".length), method, body);
        } else if (url.pathname.startsWith("/api/tools/")) {
          resp = await ToolsFunction(env, url.pathname.slice("/api/tools/".length), method, body);
        } else if (url.pathname.startsWith("/api/files/")) {
          resp = await FilesFunction(env, url.pathname.slice("/api/files/".length), method, body);
        } else if (url.pathname.startsWith("/api/study-notes/")) {
          resp = await StudyNotesFunction(env, url.pathname.slice("/api/study-notes/".length), method, body);
        } else if (url.pathname === "/api/settings/stats" || url.pathname === "/api/settings/stats/") {
          resp = await StatsFunction(env);
        } else if (url.pathname === "/api/settings/customization" || url.pathname === "/api/settings/customization/") {
          resp = await CustomizationFunction(env, url.pathname.slice("/api/settings/customization".length), method, body, session.payload);
        };
        // Return response
        return new Response(JSON.stringify({
          resp
        }), {
          headers: corsHeaders
        })
      } catch (e) {
        console.error("API ERROR:", e?.stack || e);
        // await sendErrorEmail(env, e, `API ${url.pathname}`);
        return new Response(JSON.stringify({
          error: e?.message,
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // =========================
    // 🌐 SITE (Cloudflare assets)
    // =========================
    
    // Add CORS headers for assets to allow browser loading
    if (url.pathname.startsWith("/assets/")) {
      const assetResponse = await env.ASSETS.fetch(request);
      
      if (assetResponse.ok) {
        // For SVG files, serve with correct content-type
        const isSvg = url.pathname.endsWith('.svg');
        const contentType = isSvg ? 'image/svg+xml; charset=utf-8' : (assetResponse.headers.get("Content-Type") || "application/octet-stream");
        
        return new Response(assetResponse.body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }
      
      return assetResponse;
    }
    
    // "/", "/pages" and "/pages/" all land on home. Supabase sends users to
    // "/pages/" after login; serving home there lets the client guard run and
    // bounce to the originally-requested page (post-auth redirect cookie).
    if (
      url.pathname === "/" ||
      url.pathname === "" ||
      url.pathname === "/pages" ||
      url.pathname === "/pages/"
    ) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/pages/home/index.html";
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }
   
    if (url.pathname === "/settings" || url.pathname === "/settings/") {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/pages/settings/index.html";
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (url.pathname === `/pages/parent`) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/pages/workspace/index2.html";
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }
   
    const pageMatch = url.pathname.match(/^\/pages\/([^/]+)\/?$/);
    if (pageMatch) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = `/pages/${pageMatch[1]}/index.html`;
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }
   
   // Handle /study-notes route (alias for /pages/study-notes)
   if (url.pathname === "/study-notes") {
     const assetUrl = new URL(request.url);
     assetUrl.pathname = "/pages/study-notes/index.html";
     return env.ASSETS.fetch(new Request(assetUrl, request));
   }

    return env.ASSETS.fetch(request)
  },

  async scheduled(event, env, ctx) {
    // Déclencher le workflow check_grades
    try {
      await env.CHECK_GRADES.create();
    } catch (error) {
      console.error("Error triggering check_grades workflow:", error);
    }
  }
}

// Export the workflows code
export { CheckGradesWorkflow };
