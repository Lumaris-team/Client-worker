CREATE TABLE IF NOT EXISTS customization (
  user_id TEXT PRIMARY KEY,
  background_type TEXT NOT NULL DEFAULT 'gradient',
  background_gradient_style TEXT NOT NULL DEFAULT 'linear',
  background_gradient_orientation TEXT NOT NULL DEFAULT '135deg',
  background_color_1 TEXT NOT NULL DEFAULT '#0b3f91',
  background_color_2 TEXT NOT NULL DEFAULT '#1c8cff',
  background_solid_color TEXT NOT NULL DEFAULT '#08100f',
  background_font_family TEXT NOT NULL DEFAULT 'Inter, ui-sans-serif, system-ui, sans-serif',
  background_font_weight TEXT NOT NULL DEFAULT '500',
  background_font_size INTEGER NOT NULL DEFAULT 16,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customization_user_id ON customization(user_id);
