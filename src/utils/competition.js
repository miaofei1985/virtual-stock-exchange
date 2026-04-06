const COMP_KEY = 'vse_competition';

export function getCompetitions() {
  try {
    return JSON.parse(localStorage.getItem(COMP_KEY) || '[]');
  } catch { return []; }
}

export function saveCompetitions(comps) {
  localStorage.setItem(COMP_KEY, JSON.stringify(comps));
}

export function createCompetition({ name, startBalance, durationDays, creatorId, creatorName }) {
  const comps = getCompetitions();
  const comp = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    startBalance: startBalance || 100000,
    startTime: Date.now(),
    endTime: Date.now() + (durationDays || 7) * 86400000,
    durationDays: durationDays || 7,
    creatorId,
    creatorName,
    participants: [],
    status: 'active',
  };
  comps.push(comp);
  saveCompetitions(comps);
  return comp;
}

export function joinCompetition(compId, userId, username) {
  const comps = getCompetitions();
  const comp = comps.find(c => c.id === compId);
  if (!comp) return null;
  if (comp.participants.find(p => p.userId === userId)) return comp;
  comp.participants.push({
    userId,
    username,
    joinTime: Date.now(),
    startingBalance: comp.startBalance,
    portfolio: { balance: comp.startBalance, positions: {}, orders: [] },
    equity: comp.startBalance,
    pnl: 0,
    pnlPct: 0,
  });
  saveCompetitions(comps);
  return comp;
}

export function updateParticipant(compId, userId, portfolio, currentPrices) {
  const comps = getCompetitions();
  const comp = comps.find(c => c.id === compId);
  if (!comp) return;
  const p = comp.participants.find(pp => pp.userId === userId);
  if (!p) return;
  p.portfolio = portfolio;
  const positionsValue = Object.entries(portfolio.positions || {}).reduce((sum, [sym, pos]) => {
    const price = currentPrices[sym] || pos.avgCost;
    return sum + price * pos.shares;
  }, 0);
  p.equity = +(portfolio.balance + positionsValue).toFixed(2);
  p.pnl = +(p.equity - p.startingBalance).toFixed(2);
  p.pnlPct = +((p.pnl / p.startingBalance) * 100).toFixed(2);
  saveCompetitions(comps);
}

export function getLeaderboard(compId) {
  const comps = getCompetitions();
  const comp = comps.find(c => c.id === compId);
  if (!comp) return [];
  return [...comp.participants].sort((a, b) => b.pnlPct - a.pnlPct);
}

export function getCompetitionStatus(comp) {
  const now = Date.now();
  const start = (comp.startTime || comp.start_time * 1000);
  const end = (comp.endTime || comp.end_time * 1000);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

export function getTimeRemaining(comp) {
  const end = (comp.endTime || comp.end_time * 1000);
  const remaining = end - Date.now();
  if (remaining <= 0) return 'Ended';
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
