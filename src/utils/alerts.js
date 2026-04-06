// Price alerts and stop-loss management

const ALERTS_KEY = (uid) => `vse_alerts_${uid}`;

export function loadAlerts(userId) {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY(userId)) || '[]'); } catch { return []; }
}

export function saveAlerts(userId, alerts) {
  localStorage.setItem(ALERTS_KEY(userId), JSON.stringify(alerts));
}

export function createAlert(userId, alert) {
  const alerts = loadAlerts(userId);
  const newAlert = {
    id: Date.now(),
    symbol: alert.symbol,
    type: alert.type,           // 'above' | 'below' | 'stop_loss' | 'take_profit'
    price: parseFloat(alert.price),
    note: alert.note || '',
    triggered: false,
    createdAt: Date.now(),
  };
  alerts.push(newAlert);
  saveAlerts(userId, alerts);
  return newAlert;
}

export function deleteAlert(userId, alertId) {
  const alerts = loadAlerts(userId).filter(a => a.id !== alertId);
  saveAlerts(userId, alerts);
  return alerts;
}

export function checkAlerts(userId, stocks) {
  const alerts = loadAlerts(userId);
  const triggered = [];
  const updated = alerts.map(a => {
    if (a.triggered) return a;
    const stock = stocks.find(s => s.symbol === a.symbol);
    if (!stock) return a;
    let hit = false;
    if (a.type === 'above' && stock.currentPrice >= a.price) hit = true;
    if (a.type === 'below' && stock.currentPrice <= a.price) hit = true;
    if (a.type === 'stop_loss' && stock.currentPrice <= a.price) hit = true;
    if (a.type === 'take_profit' && stock.currentPrice >= a.price) hit = true;
    if (hit) {
      triggered.push({ ...a, triggeredAt: stock.currentPrice });
      return { ...a, triggered: true };
    }
    return a;
  });
  if (triggered.length > 0) saveAlerts(userId, updated);
  return { triggered, all: updated };
}
