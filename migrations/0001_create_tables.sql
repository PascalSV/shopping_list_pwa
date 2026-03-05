-- Create tables.sql
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_device_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  name TEXT NOT NULL,
  remark TEXT,
  position TEXT,
  completed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_device_id TEXT NOT NULL,
  last_modified_by_device_id TEXT NOT NULL,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items_history (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL UNIQUE,
  last_used_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  device_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  last_sync_at TEXT NOT NULL,
  list_version INTEGER DEFAULT 0,
  PRIMARY KEY (device_id, list_id),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at);
CREATE INDEX IF NOT EXISTS idx_items_history_name ON items_history(item_name);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_list_id ON sync_metadata(list_id);
