# 📈 Virtual Stock Exchange (VSE)

A professional-grade stock market simulator inspired by MT4/MT5 trading terminals.

## Features

- **Real-time price simulation** — prices move on a random walk with mean reversion and market impact from your own trades
- **Market impact engine** — your large buy/sell orders actually push the price up or down (feel the thrill!)
- **MT4-style candlestick charts** powered by [lightweight-charts](https://github.com/tradingview/lightweight-charts)
- **Multiple timeframes** — 1m, 5m, 15m, 1H, 4H, 1D, 1W
- **Technical indicators** — SMA, EMA (9/21), Bollinger Bands, RSI, MACD, Volume
- **Live order book** with bid/ask spread visualization
- **Full trade execution** — buy/sell with percentage shortcuts (25%/50%/75%/100%)
- **Portfolio tracker** — positions, unrealized P&L, trade history
- **12 real-world stock symbols** — AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL, META, AMD, NFLX, COIN, BABA, SPY

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start trading.

## Stack

- React 18
- Tailwind CSS
- lightweight-charts (TradingView)
- Pure JavaScript indicators (SMA, EMA, Bollinger, RSI, MACD)

## Virtual Balance

You start with **$100,000** in virtual cash. No real money involved — just the thrill of the market.
