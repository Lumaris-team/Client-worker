-- Create customization table for user settings
CREATE TABLE IF NOT EXISTS customization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  background_type TEXT DEFAULT 'gradient',
  background_gradient_style TEXT DEFAULT 'linear',
  background_gradient_orientation TEXT DEFAULT '135deg',
  background_color_1 TEXT DEFAULT '#0b3f91',
  background_color_2 TEXT DEFAULT '#1c8cff',
  background_solid_color TEXT DEFAULT '#08100f',
  background_font_family TEXT DEFAULT 'Inter, ui-sans-serif, system-ui, sans-serif',
  background_font_weight TEXT DEFAULT '500',
  background_font_size INTEGER DEFAULT 16,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_customization_user_id ON customization(user_id);
