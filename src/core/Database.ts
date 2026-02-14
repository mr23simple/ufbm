import DatabaseConstructor from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';

export class Database {
  private static instance: any;
  private db: any;

  private constructor() {
    const dbPath = path.join(process.cwd(), 'usmm.db');
    this.db = new DatabaseConstructor(dbPath, { timeout: 5000 });
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  public static getInstance(): any {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance.db;
  }

  private init() {
    // Accounts table for persistence of credentials and platform IDs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        access_token TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, platform_id)
      );
    `);

    // Tasks table for queue persistence
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        page_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        error_log TEXT,
        scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Index for queue performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status_priority_scheduled ON tasks(status, priority, scheduled_at);
    `);

    logger.info('Database initialized and migrated');
  }
}
