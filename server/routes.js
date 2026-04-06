import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import db from './db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vse-dev-secret-change-in-production';

// Auth middleware
export function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ===== Auth Routes =====

router.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username taken' });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)').run(id, username, email, hash);
  db.prepare('INSERT INTO portfolios (user_id) VALUES (?)').run(id);

  const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, username, email } });
});

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// ===== Portfolio Routes =====

router.get('/portfolio', auth, (req, res) => {
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(req.user.id);
  const positions = db.prepare('SELECT * FROM positions WHERE user_id = ? AND shares > 0').all(req.user.id);
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({ portfolio, positions, orders });
});

router.post('/trade', auth, (req, res) => {
  const { symbol, side, quantity, price } = req.body;
  const qty = parseFloat(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });

  const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(req.user.id);
  const total = +(price * qty).toFixed(2);

  if (side === 'buy' && total > portfolio.balance) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  const position = db.prepare('SELECT * FROM positions WHERE user_id = ? AND symbol = ?').get(req.user.id, symbol) || { shares: 0, avg_cost: 0 };
  let newShares, newAvgCost, balanceDelta, realizedPnl = 0;

  if (side === 'buy') {
    const totalShares = position.shares + qty;
    newAvgCost = +((position.shares * position.avg_cost + qty * price) / totalShares).toFixed(2);
    newShares = totalShares;
    balanceDelta = -total;
  } else {
    if (position.shares < qty) return res.status(400).json({ error: 'Not enough shares' });
    realizedPnl = +((price - position.avg_cost) * qty).toFixed(2);
    newShares = +(position.shares - qty).toFixed(4);
    newAvgCost = position.avg_cost;
    balanceDelta = total;
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE portfolios SET balance = balance + ?, updated_at = unixepoch() WHERE user_id = ?').run(balanceDelta, req.user.id);
    if (newShares <= 0) {
      db.prepare('DELETE FROM positions WHERE user_id = ? AND symbol = ?').run(req.user.id, symbol);
    } else {
      db.prepare(`INSERT INTO positions (user_id, symbol, shares, avg_cost) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, symbol) DO UPDATE SET shares = ?, avg_cost = ?, updated_at = unixepoch()`)
        .run(req.user.id, symbol, newShares, newAvgCost, newShares, newAvgCost);
    }
    db.prepare('INSERT INTO orders (user_id, symbol, side, quantity, price, total, realized_pnl) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.user.id, symbol, side, qty, price, total, realizedPnl);
  });
  tx();

  res.json({ success: true, realizedPnl });
});

// ===== Pending Orders =====

router.get('/pending-orders', auth, (req, res) => {
  const orders = db.prepare("SELECT * FROM pending_orders WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC").all(req.user.id);
  res.json(orders);
});

router.post('/pending-orders', auth, (req, res) => {
  const { symbol, type, quantity, triggerPrice } = req.body;
  const result = db.prepare('INSERT INTO pending_orders (user_id, symbol, type, quantity, trigger_price) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, symbol, type, quantity, triggerPrice);
  res.json({ id: result.lastInsertRowid, success: true });
});

router.delete('/pending-orders/:id', auth, (req, res) => {
  db.prepare("UPDATE pending_orders SET status = 'cancelled' WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ===== Competitions =====

router.get('/competitions', (req, res) => {
  const comps = db.prepare('SELECT * FROM competitions ORDER BY created_at DESC').all();
  const result = comps.map(c => {
    const participants = db.prepare('SELECT cp.*, u.username FROM competition_participants cp JOIN users u ON cp.user_id = u.id WHERE cp.competition_id = ? ORDER BY cp.pnl_pct DESC').all(c.id);
    return { ...c, participants };
  });
  res.json(result);
});

router.post('/competitions', auth, (req, res) => {
  const { name, startBalance, durationDays } = req.body;
  const id = uuid().slice(0, 8);
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + (durationDays || 7) * 86400;
  db.prepare('INSERT INTO competitions (id, name, start_balance, start_time, end_time, creator_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, startBalance || 100000, startTime, endTime, req.user.id);
  // Auto-join creator
  db.prepare('INSERT INTO competition_participants (competition_id, user_id, starting_balance, equity) VALUES (?, ?, ?, ?)')
    .run(id, req.user.id, startBalance || 100000, startBalance || 100000);
  res.json({ id, success: true });
});

router.post('/competitions/:id/join', auth, (req, res) => {
  const comp = db.prepare('SELECT * FROM competitions WHERE id = ?').get(req.params.id);
  if (!comp) return res.status(404).json({ error: 'Competition not found' });
  const existing = db.prepare('SELECT id FROM competition_participants WHERE competition_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.json({ success: true, alreadyJoined: true });
  db.prepare('INSERT INTO competition_participants (competition_id, user_id, starting_balance, equity) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.user.id, comp.start_balance, comp.start_balance);
  res.json({ success: true });
});

// ===== Alerts =====

router.get('/alerts', auth, (req, res) => {
  const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? AND active = 1').all(req.user.id);
  res.json(alerts);
});

router.post('/alerts', auth, (req, res) => {
  const { symbol, type, price } = req.body;
  const result = db.prepare('INSERT INTO alerts (user_id, symbol, type, price) VALUES (?, ?, ?, ?)')
    .run(req.user.id, symbol, type, price);
  res.json({ id: result.lastInsertRowid, success: true });
});

router.delete('/alerts/:id', auth, (req, res) => {
  db.prepare('UPDATE alerts SET active = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ===== Market Data =====

router.get('/stocks', (req, res) => {
  res.json(req.app.locals.marketEngine.getAllStocks());
});

router.get('/stocks/:symbol', (req, res) => {
  const stock = req.app.locals.marketEngine.getStock(req.params.symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  res.json(stock);
});

export default router;
