// Server-side market simulation engine

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.5, sector: 'Technology', volatility: 0.012 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.2, sector: 'EV', volatility: 0.028 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.4, sector: 'Semiconductors', volatility: 0.025 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.8, sector: 'Technology', volatility: 0.011 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.3, sector: 'E-Commerce', volatility: 0.016 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 156.7, sector: 'Technology', volatility: 0.013 },
  { symbol: 'META', name: 'Meta Platforms', price: 505.2, sector: 'Social Media', volatility: 0.018 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 178.9, sector: 'Semiconductors', volatility: 0.030 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 625.4, sector: 'Streaming', volatility: 0.022 },
  { symbol: 'COIN', name: 'Coinbase Global', price: 225.6, sector: 'Crypto', volatility: 0.045 },
  { symbol: 'BABA', name: 'Alibaba Group', price: 78.3, sector: 'E-Commerce', volatility: 0.025 },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 498.7, sector: 'ETF', volatility: 0.008 },
];

class MarketEngine {
  constructor() {
    this.stocks = STOCKS.map(s => ({
      ...s,
      currentPrice: s.price,
      prevPrice: s.price,
      change: 0,
      changePct: 0,
      bid: +(s.price * 0.9998).toFixed(2),
      ask: +(s.price * 1.0002).toFixed(2),
      volume: Math.floor(Math.random() * 1000000),
      marketImpact: 0,
    }));
    this.interval = null;
    this.listeners = [];
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 800);
    console.log('📈 Market engine started');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  tick() {
    this.stocks = this.stocks.map(s => {
      const vol = s.volatility;
      const meanReversion = (s.price - s.currentPrice) / s.price * 0.08;
      const impact = s.marketImpact * 0.002;
      const rand = (Math.random() - 0.499) * vol;
      const changeFactor = 1 + rand + meanReversion + impact;
      const newPrice = Math.max(0.01, +(s.currentPrice * changeFactor).toFixed(2));
      const change = +(newPrice - s.price).toFixed(2);
      const changePct = +((change / s.price) * 100).toFixed(2);
      const spread = newPrice * 0.0002;

      return {
        ...s,
        prevPrice: s.currentPrice,
        currentPrice: newPrice,
        change,
        changePct,
        bid: +(newPrice - spread).toFixed(2),
        ask: +(newPrice + spread).toFixed(2),
        volume: s.volume + Math.floor(Math.random() * 10000),
        marketImpact: s.marketImpact * 0.92,
      };
    });

    // Notify listeners
    this.listeners.forEach(fn => fn(this.stocks));
  }

  onUpdate(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  getStock(symbol) {
    return this.stocks.find(s => s.symbol === symbol);
  }

  getAllStocks() {
    return this.stocks;
  }

  addImpact(symbol, direction, quantity, price) {
    this.stocks = this.stocks.map(s => {
      if (s.symbol !== symbol) return s;
      const impactMag = (quantity * price) / 500000;
      return { ...s, marketImpact: s.marketImpact + direction * impactMag };
    });
  }
}

export const marketEngine = new MarketEngine();
