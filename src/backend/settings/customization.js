function normalizePath(path) {
  return path.replace(/^\/+/, "");
}

export async function CustomizationFunction(env, path, method, body, sessionPayload) {
  const subpath = normalizePath(path || "");
  const userId = sessionPayload?.sub ?? sessionPayload?.email ?? "anonymous";

  if (subpath && subpath !== "/") {
    return { error: "unknown_settings_route" };
  }

  if (method === "GET") {
    return await getCustomizationSettings(env, userId);
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const settings = body?.settings ?? body;
    return await setCustomizationSettings(env, userId, settings);
  }

  return { error: "method_not_allowed" };
}

async function getCustomizationSettings(env, userId) {
  try {
    const db = env.customization;
    
    // Get user's customization settings
    const result = await db.prepare(
      "SELECT * FROM customization WHERE user_id = ?"
    ).bind(userId).first();
    
    if (!result) {
      // Return default settings if none exist
      return {
        settings: {
          background_type: "gradient",
          background_gradient_style: "linear",
          background_gradient_orientation: "135deg",
          background_color_1: "#0b3f91",
          background_color_2: "#1c8cff",
          background_solid_color: "#08100f",
          background_font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
          background_font_weight: "500",
          background_font_size: 16,
        }
      };
    }
    
    // Convert database row to settings object
    const settings = {
      background_type: result.background_type || "gradient",
      background_gradient_style: result.background_gradient_style || "linear",
      background_gradient_orientation: result.background_gradient_orientation || "135deg",
      background_color_1: result.background_color_1 || "#0b3f91",
      background_color_2: result.background_color_2 || "#1c8cff",
      background_solid_color: result.background_solid_color || "#08100f",
      background_font_family: result.background_font_family || "Inter, ui-sans-serif, system-ui, sans-serif",
      background_font_weight: result.background_font_weight || "500",
      background_font_size: result.background_font_size || 16,
    };
    
    return { settings };
  } catch (error) {
    console.error("Error fetching customization settings:", error);
    return { error: "failed_to_fetch_settings" };
  }
}

async function setCustomizationSettings(env, userId, settings) {
  try {
    const db = env.customization;
    
    // Normalize settings
    const normalizedSettings = {
      background_type: settings.background_type || "gradient",
      background_gradient_style: settings.background_gradient_style || "linear",
      background_gradient_orientation: settings.background_gradient_orientation || "135deg",
      background_color_1: settings.background_color_1 || "#0b3f91",
      background_color_2: settings.background_color_2 || "#1c8cff",
      background_solid_color: settings.background_solid_color || "#08100f",
      background_font_family: settings.background_font_family || "Inter, ui-sans-serif, system-ui, sans-serif",
      background_font_weight: settings.background_font_weight || "500",
      background_font_size: settings.background_font_size || 16,
    };
    
    // Check if user already has settings
    const existing = await db.prepare(
      "SELECT user_id FROM customization WHERE user_id = ?"
    ).bind(userId).first();
    
    if (existing) {
      // Update existing settings
      const result = await db.prepare(`
        UPDATE customization 
        SET background_type = ?,
            background_gradient_style = ?,
            background_gradient_orientation = ?,
            background_color_1 = ?,
            background_color_2 = ?,
            background_solid_color = ?,
            background_font_family = ?,
            background_font_weight = ?,
            background_font_size = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(
        normalizedSettings.background_type,
        normalizedSettings.background_gradient_style,
        normalizedSettings.background_gradient_orientation,
        normalizedSettings.background_color_1,
        normalizedSettings.background_color_2,
        normalizedSettings.background_solid_color,
        normalizedSettings.background_font_family,
        normalizedSettings.background_font_weight,
        normalizedSettings.background_font_size,
        userId
      ).run();
      
      console.log("Update result:", result);
    } else {
      // Insert new settings
      const result = await db.prepare(`
        INSERT INTO customization (
          user_id,
          background_type,
          background_gradient_style,
          background_gradient_orientation,
          background_color_1,
          background_color_2,
          background_solid_color,
          background_font_family,
          background_font_weight,
          background_font_size,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        userId,
        normalizedSettings.background_type,
        normalizedSettings.background_gradient_style,
        normalizedSettings.background_gradient_orientation,
        normalizedSettings.background_color_1,
        normalizedSettings.background_color_2,
        normalizedSettings.background_solid_color,
        normalizedSettings.background_font_family,
        normalizedSettings.background_font_weight,
        normalizedSettings.background_font_size
      ).run();
      
      console.log("Insert result:", result);
    }
    
    return { settings: normalizedSettings };
  } catch (error) {
    console.error("Error saving customization settings:", error);
    console.error("Error details:", error.message);
    return { error: "failed_to_save_settings" };
  }
}
