const API_URL = process.env.REACT_APP_API_URL || '';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('vse_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('vse_token', token);
    else localStorage.removeItem('vse_token');
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_URL}/api${path}`, { ...options, headers: { ...headers, ...options.headers } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  del(path) { return this.request(path, { method: 'DELETE' }); }

  // Auth
  async register(username, email, password) {
    const data = await this.post('/auth/register', { username, email, password });
    this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.post('/auth/login', { username, password });
    this.setToken(data.token);
    return data;
  }

  logout() { this.setToken(null); }

  // Portfolio
  getPortfolio() { return this.get('/portfolio'); }
  trade(symbol, side, quantity, price) { return this.post('/trade', { symbol, side, quantity, price }); }

  // Pending Orders
  getPendingOrders() { return this.get('/pending-orders'); }
  placePendingOrder(symbol, type, quantity, triggerPrice) { return this.post('/pending-orders', { symbol, type, quantity, triggerPrice }); }
  cancelPendingOrder(id) { return this.del(`/pending-orders/${id}`); }

  // Competitions
  getCompetitions() { return this.get('/competitions'); }
  createCompetition(name, startBalance, durationDays) { return this.post('/competitions', { name, startBalance, durationDays }); }
  joinCompetition(id) { return this.post(`/competitions/${id}/join`); }
  deleteCompetition(id) { return this.del(`/competitions/${id}`); }

  // Alerts
  getAlerts() { return this.get('/alerts'); }
  addAlert(symbol, type, price) { return this.post('/alerts', { symbol, type, price }); }
  removeAlert(id) { return this.del(`/alerts/${id}`); }

  // Market
  getStocks() { return this.get('/stocks'); }
}

export const api = new ApiClient();
export default api;
