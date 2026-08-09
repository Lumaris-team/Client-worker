CREATE TABLE IF NOT EXISTS customization (
  id TEXT PRIMARY KEY,
  settings TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customization_id ON customization(id);
