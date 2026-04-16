import Database from 'better-sqlite3';

const db = new Database('app.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

export function initDb() {
  db.pragma('foreign_keys = OFF');
  
  db.exec(`
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS downloads;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS availability_slots;
    DROP TABLE IF EXISTS users;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'client', -- 'client' or 'professional'
      timezone TEXT DEFAULT 'UTC',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS availability_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professional_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      is_booked INTEGER DEFAULT 0,
      FOREIGN KEY(professional_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER NOT NULL,
      client_id INTEGER,
      guest_name TEXT,
      guest_email TEXT,
      status TEXT DEFAULT 'booked', -- 'booked', 'cancelled', 'rescheduled'
      no_show INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(slot_id) REFERENCES availability_slots(id) ON DELETE CASCADE,
      FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  db.pragma('foreign_keys = ON');
}

export default db;
