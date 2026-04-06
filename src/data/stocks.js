// Real stock tickers with realistic base prices
export const STOCKS = [
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
  { symbol: 'SPY',  name: 'S&P 500 ETF', price: 498.7, sector: 'ETF', volatility: 0.008 },
];

// Generate historical OHLCV candles
export function generateHistoricalData(basePrice, volatility, count, intervalMs) {
  const candles = [];
  let price = basePrice * (0.6 + Math.random() * 0.2); // start lower
  const now = Date.now();
  const startTime = now - count * intervalMs;

  for (let i = 0; i < count; i++) {
    const time = Math.floor((startTime + i * intervalMs) / 1000);
    const open = price;
    const changeRange = price * volatility * (0.5 + Math.random());
    const direction = Math.random() > 0.48 ? 1 : -1;
    const bodySize = changeRange * (0.3 + Math.random() * 0.7);
    const close = open + direction * bodySize;
    const wickUp = Math.random() * changeRange * 0.5;
    const wickDown = Math.random() * changeRange * 0.5;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = Math.floor(10000 + Math.random() * 90000);

    candles.push({
      time,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });

    price = close;
  }

  // Normalize so last close ≈ basePrice
  const lastClose = candles[candles.length - 1].close;
  const factor = basePrice / lastClose;
  return candles.map(c => ({
    ...c,
    open: +(c.open * factor).toFixed(2),
    high: +(c.high * factor).toFixed(2),
    low: +(c.low * factor).toFixed(2),
    close: +(c.close * factor).toFixed(2),
  }));
}

export const TIMEFRAMES = [
  { label: '1m',  ms: 60_000,        count: 300 },
  { label: '5m',  ms: 300_000,       count: 300 },
  { label: '15m', ms: 900_000,       count: 300 },
  { label: '1H',  ms: 3_600_000,     count: 500 },
  { label: '4H',  ms: 14_400_000,    count: 500 },
  { label: '1D',  ms: 86_400_000,    count: 500 },
  { label: '1W',  ms: 604_800_000,   count: 200 },
];
