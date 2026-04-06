import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { marketEngine } from './market.js';
import apiRoutes, { auth } from './routes.js';
import db from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.locals.marketEngine = marketEngine;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend build
app.use(express.static(join(__dirname, '..', 'build')));

// API routes
app.use('/api', apiRoutes);

// ===== WebSocket =====
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  // Send initial data
  ws.send(JSON.stringify({ type: 'stocks', data: marketEngine.getAllStocks() }));

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'subscribe') {
        ws.symbols = parsed.symbols || [];
      }
    } catch {}
  });

  ws.on('close', () => clients.delete(ws));
});

// Broadcast market updates
marketEngine.onUpdate((stocks) => {
  const payload = JSON.stringify({ type: 'tick', data: stocks });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
});

// Check pending orders
setInterval(() => {
  const pendingOrders = db.prepare("SELECT * FROM pending_orders WHERE status = 'active'").all();
  if (pendingOrders.length === 0) return;

  const fillOrder = db.transaction((order) => {
    const stock = marketEngine.getStock(order.symbol);
    if (!stock) return;
    const price = stock.currentPrice;
    let triggered = false;

    if (order.type === 'limit_buy' && price <= order.trigger_price) triggered = true;
    if (order.type === 'limit_sell' && price >= order.trigger_price) triggered = true;
    if (order.type === 'stop_buy' && price >= order.trigger_price) triggered = true;
    if (order.type === 'stop_sell' && price <= order.trigger_price) triggered = true;

    if (triggered) {
      const side = order.type.includes('buy') ? 'buy' : 'sell';
      const total = +(price * order.quantity).toFixed(2);
      const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(order.user_id);
      const position = db.prepare('SELECT * FROM positions WHERE user_id = ? AND symbol = ?').get(order.user_id, order.symbol) || { shares: 0, avg_cost: 0 };

      // Validate before marking as filled
      if (side === 'buy' && total > portfolio.balance) return;
      if (side === 'sell' && position.shares < order.quantity) return;

      db.prepare("UPDATE pending_orders SET status = 'filled' WHERE id = ?").run(order.id);

      let newShares, newAvgCost, balanceDelta, realizedPnl = 0;

      if (side === 'buy') {
        const totalShares = position.shares + order.quantity;
        newAvgCost = +((position.shares * position.avg_cost + order.quantity * price) / totalShares).toFixed(2);
        newShares = totalShares;
        balanceDelta = -total;
      } else {
        realizedPnl = +((price - position.avg_cost) * order.quantity).toFixed(2);
        newShares = +(position.shares - order.quantity).toFixed(4);
        newAvgCost = position.avg_cost;
        balanceDelta = total;
      }

      db.prepare('UPDATE portfolios SET balance = balance + ?, updated_at = unixepoch() WHERE user_id = ?').run(balanceDelta, order.user_id);
      if (newShares <= 0) {
        db.prepare('DELETE FROM positions WHERE user_id = ? AND symbol = ?').run(order.user_id, order.symbol);
      } else {
        db.prepare(`INSERT INTO positions (user_id, symbol, shares, avg_cost) VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, symbol) DO UPDATE SET shares = ?, avg_cost = ?, updated_at = unixepoch()`)
          .run(order.user_id, order.symbol, newShares, newAvgCost, newShares, newAvgCost);
      }
      db.prepare('INSERT INTO orders (user_id, symbol, side, quantity, price, total, realized_pnl, order_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(order.user_id, order.symbol, side, order.quantity, price, total, realizedPnl, order.type);

      console.log(`📋 Pending order filled: ${order.type} ${order.quantity} ${order.symbol} @ $${price}`);
    }
  });

  pendingOrders.forEach(order => fillOrder(order));
}, 1000);

// Check alerts
setInterval(() => {
  const alerts = db.prepare('SELECT a.*, u.username FROM alerts a JOIN users u ON a.user_id = u.id WHERE a.active = 1').all();
  alerts.forEach(alert => {
    const stock = marketEngine.getStock(alert.symbol);
    if (!stock) return;
    let triggered = false;
    if (alert.type === 'above' && stock.currentPrice >= alert.price) triggered = true;
    if (alert.type === 'below' && stock.currentPrice <= alert.price) triggered = true;
    if (alert.type === 'stop_loss' && stock.currentPrice <= alert.price) triggered = true;
    if (alert.type === 'take_profit' && stock.currentPrice >= alert.price) triggered = true;
    if (triggered) {
      db.prepare('UPDATE alerts SET active = 0 WHERE id = ?').run(alert.id);
      console.log(`🔔 Alert triggered: ${alert.type} ${alert.symbol} @ $${stock.currentPrice} for ${alert.username}`);
    }
  });
}, 2000);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'build', 'index.html'));
});

// Update competition P&L for active competitions
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  const activeComps = db.prepare("SELECT * FROM competitions WHERE status = 'active' AND end_time > ?").all(now);
  activeComps.forEach(comp => {
    const participants = db.prepare('SELECT * FROM competition_participants WHERE competition_id = ?').all(comp.id);
    participants.forEach(p => {
      // Get user's current portfolio
      const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(p.user_id);
      if (!portfolio) return;
      const positions = db.prepare('SELECT * FROM positions WHERE user_id = ? AND shares > 0').all(p.user_id);
      // Calculate equity from portfolio balance + positions value
      let positionsValue = 0;
      positions.forEach(pos => {
        const stock = marketEngine.getStock(pos.symbol);
        if (stock) positionsValue += stock.currentPrice * pos.shares;
        else positionsValue += pos.avg_cost * pos.shares;
      });
      const equity = +(portfolio.balance + positionsValue).toFixed(2);
      const pnl = +(equity - p.starting_balance).toFixed(2);
      const pnlPct = +((equity / p.starting_balance - 1) * 100).toFixed(2);
      db.prepare('UPDATE competition_participants SET equity = ?, pnl = ?, pnl_pct = ? WHERE id = ?')
        .run(equity, pnl, pnlPct, p.id);
    });
  });
  // Auto-end expired competitions
  db.prepare("UPDATE competitions SET status = 'ended' WHERE status = 'active' AND end_time <= ?").run(now);
}, 5000);

// Start
marketEngine.start();
server.listen(PORT, () => {
  console.log(`\n🚀 VSE Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`💹 Market engine: ${marketEngine.getAllStocks().length} symbols\n`);
});
