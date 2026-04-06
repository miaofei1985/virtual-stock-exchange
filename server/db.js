import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'vse.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    provider TEXT DEFAULT 'local',
    avatar TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    balance REAL DEFAULT 1000000,
    equity REAL DEFAULT 100000,
    total_pnl REAL DEFAULT 0,
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    symbol TEXT NOT NULL,
    shares REAL NOT NULL DEFAULT 0,
    avg_cost REAL NOT NULL DEFAULT 0,
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('buy','sell')),
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    total REAL NOT NULL,
    realized_pnl REAL DEFAULT 0,
    order_type TEXT DEFAULT 'market' CHECK(order_type IN ('market','limit','stop')),
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS pending_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('limit_buy','limit_sell','stop_buy','stop_sell')),
    quantity REAL NOT NULL,
    trigger_price REAL NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','filled','cancelled')),
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_balance REAL DEFAULT 100000,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    creator_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'active' CHECK(status IN ('active','ended')),
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS competition_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id TEXT REFERENCES competitions(id),
    user_id TEXT REFERENCES users(id),
    starting_balance REAL DEFAULT 100000,
    equity REAL DEFAULT 100000,
    pnl REAL DEFAULT 0,
    pnl_pct REAL DEFAULT 0,
    joined_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(competition_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('above','below','stop_loss','take_profit')),
    price REAL NOT NULL,
    active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
`);

export default db;
