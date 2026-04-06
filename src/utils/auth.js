// Simulated auth system using localStorage
// In production, replace with Firebase Auth or similar

const USERS_KEY = 'vse_users';
const SESSION_KEY = 'vse_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function registerEmail(email, password, username) {
  const users = getUsers();
  const id = email.toLowerCase();
  if (users[id]) throw new Error('Email already registered');
  if (!username || username.length < 2) throw new Error('Username must be at least 2 characters');
  const user = { id, email, username, provider: 'email', avatar: null, createdAt: Date.now() };
  users[id] = { ...user, password };
  saveUsers(users);
  saveSession(user);
  return user;
}

export function loginEmail(email, password) {
  const users = getUsers();
  const id = email.toLowerCase();
  const found = users[id];
  if (!found) throw new Error('Account not found');
  if (found.password !== password) throw new Error('Incorrect password');
  const user = { id: found.id, email: found.email, username: found.username, provider: found.provider, avatar: found.avatar };
  saveSession(user);
  return user;
}

// Simulate OAuth — in a real app these would be proper OAuth flows
export function loginOAuth(provider) {
  const mockEmails = { google: 'demo_google@gmail.com', github: 'demo_github@users.noreply.github.com' };
  const mockNames = { google: 'Google User', github: 'GitHub User' };
  const mockAvatars = {
    google: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    github: 'https://avatars.githubusercontent.com/u/0?v=4',
  };
  const email = mockEmails[provider];
  const users = getUsers();
  const id = `${provider}:${email}`;
  if (!users[id]) {
    const user = { id, email, username: mockNames[provider], provider, avatar: mockAvatars[provider], createdAt: Date.now() };
    users[id] = user;
    saveUsers(users);
  }
  const u = users[id];
  const user = { id: u.id, email: u.email, username: u.username, provider: u.provider, avatar: u.avatar };
  saveSession(user);
  return user;
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

// Leaderboard
export function getLeaderboard() {
  const users = getUsers();
  const boards = [];
  Object.values(users).forEach(u => {
    const key = `vse_portfolio_${u.id}`;
    try {
      const p = JSON.parse(localStorage.getItem(key));
      if (p) boards.push({
        username: u.username,
        avatar: u.avatar,
        provider: u.provider,
        balance: p.balance || 1000000,
        pnl: p.totalPnl || 0,
        equity: p.equity || p.balance || 1000000,
        trades: p.orders?.length || 0,
      });
    } catch {}
  });
  return boards.sort((a, b) => b.equity - a.equity);
}
