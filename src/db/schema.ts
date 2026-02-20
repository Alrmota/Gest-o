import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'construction.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager', 'engineer', 'foreman', 'financial')) NOT NULL,
      name TEXT NOT NULL
    )
  `);

  // Projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT NOT NULL,
      built_area REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      contract_value REAL NOT NULL,
      status TEXT CHECK(status IN ('planning', 'in_progress', 'completed', 'on_hold')) DEFAULT 'planning',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stages (Etapas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Activities (Atividades)
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      unit TEXT NOT NULL,
      planned_quantity REAL NOT NULL,
      planned_unit_cost REAL NOT NULL,
      planned_duration INTEGER NOT NULL, -- in days
      dependency_id INTEGER,
      start_date TEXT, -- Calculated or manually set
      end_date TEXT,   -- Calculated or manually set
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
      FOREIGN KEY (dependency_id) REFERENCES activities(id) ON DELETE SET NULL
    )
  `);

  // Add display_order column if it doesn't exist (for existing DBs)
  try {
    db.exec('ALTER TABLE activities ADD COLUMN display_order INTEGER DEFAULT 0');
  } catch (e) {
    // Column likely already exists
  }

  // Compositions (Composições)
  db.exec(`
    CREATE TABLE IF NOT EXISTS compositions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      code TEXT, -- SINAPI code or custom
      description TEXT,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // Inputs (Insumos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      composition_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      type TEXT CHECK(type IN ('material', 'labor', 'equipment')) NOT NULL,
      quantity REAL NOT NULL, -- coefficient
      unit_cost REAL NOT NULL,
      unit TEXT NOT NULL,
      FOREIGN KEY (composition_id) REFERENCES compositions(id) ON DELETE CASCADE
    )
  `);

  // Daily Logs (Apontamentos Diários)
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      executed_quantity REAL NOT NULL,
      real_cost REAL NOT NULL,
      notes TEXT,
      user_id INTEGER,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Seed default admin user if not exists
  const stmt = db.prepare('SELECT count(*) as count FROM users');
  const result = stmt.get() as { count: number };
  
  if (result.count === 0) {
    // password is 'admin123' (hashed)
    const hash = '$2a$10$X7V.j5T.S.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v'; 
    // Note: In a real app, use bcrypt to hash properly. For this demo, I'll insert a placeholder or handle it in server.ts
    // Let's just insert a plain one for now and handle hashing in the auth service properly
    // Actually, I'll use a simple hash for the demo or just insert it in server startup
  }
}

export default db;
