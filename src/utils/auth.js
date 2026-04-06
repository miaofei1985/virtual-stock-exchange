// Session management utilities
// Auth is handled by the backend API (JWT + bcrypt)

const SESSION_KEY = 'vse_session';

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// Portfolio persistence per user
export function loadPortfolio(userId) {
  try {
    const key = `vse_portfolio_${userId}`;
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch { return null; }
}

export function savePortfolio(userId, portfolio) {
  const key = `vse_portfolio_${userId}`;
  localStorage.setItem(key, JSON.stringify({ ...portfolio, savedAt: Date.now() }));
}

// Leaderboard — reads from localStorage (client-side cache of portfolio data)
const INITIAL_BALANCE = 1000000;

export function getLeaderboard() {
  const boards = [];
  // Scan all portfolio keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('vse_portfolio_')) continue;
    try {
      const p = JSON.parse(localStorage.getItem(key));
      if (!p) continue;
      const userId = key.replace('vse_portfolio_', '');
      // Try to find username from session
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
      const username = session.id === userId ? session.username : userId.slice(0, 8);
      boards.push({
        username,
        avatar: session.id === userId ? session.avatar : null,
        provider: session.id === userId ? (session.provider || 'email') : 'email',
        balance: p.balance || INITIAL_BALANCE,
        pnl: p.totalPnl || 0,
        equity: p.equity || p.balance || INITIAL_BALANCE,
        trades: p.orders?.length || 0,
      });
    } catch {}
  }
  return boards.sort((a, b) => b.equity - a.equity);
}
