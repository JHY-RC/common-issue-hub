import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from '../config.js';

mkdirSync(DATA_DIR, {recursive: true});
export const db = new DatabaseSync(join(DATA_DIR, 'common-issues.db'));
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS versions (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id), name TEXT NOT NULL, parent_id INTEGER REFERENCES versions(id), note TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(product_id, name));
  CREATE TABLE IF NOT EXISTS issues (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id), category TEXT NOT NULL DEFAULT '共性问题', description TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

const hasColumn = (table, column) => db.prepare(`PRAGMA table_info(${table})`).all().some(item => item.name === column);
if (!hasColumn('versions', 'branch_name')) db.exec("ALTER TABLE versions ADD COLUMN branch_name TEXT NOT NULL DEFAULT '主线'");
if (!hasColumn('issues', 'occurrence_version_id')) db.exec('ALTER TABLE issues ADD COLUMN occurrence_version_id INTEGER');
db.exec(`
  CREATE TABLE IF NOT EXISTS issue_fixes (id INTEGER PRIMARY KEY, issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE, version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE, note TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(issue_id, version_id));
  CREATE INDEX IF NOT EXISTS idx_versions_product ON versions(product_id);
  CREATE INDEX IF NOT EXISTS idx_versions_parent ON versions(parent_id);
  CREATE INDEX IF NOT EXISTS idx_issues_product ON issues(product_id);
  CREATE INDEX IF NOT EXISTS idx_fixes_issue ON issue_fixes(issue_id);
`);

export const rows = (sql, params = []) => db.prepare(sql).all(...params);
export const one = (sql, params = []) => db.prepare(sql).get(...params);
export const run = (sql, params = []) => db.prepare(sql).run(...params);
