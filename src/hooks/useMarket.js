import { useState, useEffect, useRef, useCallback } from 'react';
import { STOCKS, generateHistoricalData, TIMEFRAMES } from '../data/stocks';

const INITIAL_BALANCE = 100000;

function initMarket() {
  return STOCKS.map(s => ({
    ...s,
    currentPrice: s.price,
    prevPrice: s.price,
    change: 0,
    changePct: 0,
    bid: +(s.price * 0.9998).toFixed(2),
    ask: +(s.price * 1.0002).toFixed(2),
    volume: 0,
    history: {}, // timeframe -> candles array
    marketImpact: 0, // accumulates user buy pressure
  }));
}

export function useMarket() {
  const [stocks, setStocks] = useState(initMarket);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1D');
  const [portfolio, setPortfolio] = useState({
    balance: INITIAL_BALANCE,
    positions: {}, // symbol -> { shares, avgCost }
    orders: [],    // trade history
    pnl: 0,
  });
  const [alerts, setAlerts] = useState([]); // flash notifications
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  // Pre-generate all history on mount
  useEffect(() => {
    setStocks(prev => prev.map(s => {
      const history = {};
      TIMEFRAMES.forEach(tf => {
        history[tf.label] = generateHistoricalData(s.price, s.volatility, tf.count, tf.ms);
      });
      return { ...s, history };
    }));
  }, []);

  // Market tick — price engine
  useEffect(() => {
    const interval = setInterval(() => {
      const tfObj = TIMEFRAMES.find(t => t.label === timeframe) || TIMEFRAMES[5];

      setStocks(prev => prev.map(s => {
        const vol = s.volatility;
        // Random walk + mean reversion toward base price
        const meanReversion = (s.price - s.currentPrice) / s.price * 0.08;
        // User buy pressure boosts price
        const impact = s.marketImpact * 0.002;
        const rand = (Math.random() - 0.499) * vol;
        const changeFactor = 1 + rand + meanReversion + impact;
        const newPrice = +(s.currentPrice * changeFactor).toFixed(2);
        const change = +(newPrice - s.price).toFixed(2);
        const changePct = +((change / s.price) * 100).toFixed(2);
        const spread = newPrice * 0.0002;

        // Update last candle in history
        const updatedHistory = { ...s.history };
        if (updatedHistory[timeframe] && updatedHistory[timeframe].length > 0) {
          const candles = [...updatedHistory[timeframe]];
          const last = { ...candles[candles.length - 1] };
          last.close = newPrice;
          last.high = Math.max(last.high, newPrice);
          last.low = Math.min(last.low, newPrice);
          last.volume += Math.floor(Math.random() * 5000);
          candles[candles.length - 1] = last;

          // Occasionally add new candle
          const nowSec = Math.floor(Date.now() / 1000);
          const lastTime = candles[candles.length - 1].time;
          if (nowSec - lastTime > tfObj.ms / 1000) {
            candles.push({
              time: nowSec,
              open: newPrice,
              high: newPrice,
              low: newPrice,
              close: newPrice,
              volume: Math.floor(Math.random() * 50000),
            });
          }
          updatedHistory[timeframe] = candles;
        }

        return {
          ...s,
          prevPrice: s.currentPrice,
          currentPrice: newPrice,
          change,
          changePct,
          bid: +(newPrice - spread).toFixed(2),
          ask: +(newPrice + spread).toFixed(2),
          volume: s.volume + Math.floor(Math.random() * 10000),
          history: updatedHistory,
          marketImpact: s.marketImpact * 0.92, // decay
        };
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Recalculate portfolio PnL
  useEffect(() => {
    setPortfolio(prev => {
      const positions = { ...prev.positions };
      let unrealizedPnl = 0;
      Object.entries(positions).forEach(([sym, pos]) => {
        const stock = stocksRef.current.find(s => s.symbol === sym);
        if (stock && pos.shares > 0) {
          unrealizedPnl += (stock.currentPrice - pos.avgCost) * pos.shares;
        }
      });
      return { ...prev, pnl: +unrealizedPnl.toFixed(2) };
    });
  }, [stocks]);

  const addAlert = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 3000);
  }, []);

  const executeTrade = useCallback((symbol, side, quantity) => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { addAlert('Invalid quantity', 'error'); return; }

    setStocks(prev => prev.map(s => {
      if (s.symbol !== symbol) return s;
      // User buy/sell pressure moves the market
      const impactDir = side === 'buy' ? 1 : -1;
      const impactMag = (qty * s.currentPrice) / 500000; // bigger trades = bigger impact
      return { ...s, marketImpact: s.marketImpact + impactDir * impactMag };
    }));

    setPortfolio(prev => {
      const stock = stocksRef.current.find(s => s.symbol === symbol);
      if (!stock) return prev;
      const price = side === 'buy' ? stock.ask : stock.bid;
      const total = +(price * qty).toFixed(2);

      if (side === 'buy' && total > prev.balance) {
        addAlert(`Insufficient funds — need $${total.toLocaleString()}`, 'error');
        return prev;
      }

      const positions = { ...prev.positions };
      const existing = positions[symbol] || { shares: 0, avgCost: 0 };

      let newShares, newAvgCost, balanceDelta, realizedPnl = 0;

      if (side === 'buy') {
        const totalShares = existing.shares + qty;
        newAvgCost = +((existing.shares * existing.avgCost + qty * price) / totalShares).toFixed(2);
        newShares = totalShares;
        balanceDelta = -total;
        addAlert(`✓ Bought ${qty} ${symbol} @ $${price}`, 'success');
      } else {
        if (existing.shares < qty) {
          addAlert(`Not enough shares (have ${existing.shares})`, 'error');
          return prev;
        }
        realizedPnl = +((price - existing.avgCost) * qty).toFixed(2);
        newShares = +(existing.shares - qty).toFixed(4);
        newAvgCost = existing.avgCost;
        balanceDelta = total;
        addAlert(`✓ Sold ${qty} ${symbol} @ $${price} | P&L: ${realizedPnl >= 0 ? '+' : ''}$${realizedPnl}`, realizedPnl >= 0 ? 'success' : 'warning');
      }

      if (newShares <= 0) {
        delete positions[symbol];
      } else {
        positions[symbol] = { shares: newShares, avgCost: newAvgCost };
      }

      const order = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        symbol,
        side,
        qty,
        price,
        total: +total.toFixed(2),
        realizedPnl,
      };

      return {
        ...prev,
        balance: +(prev.balance + balanceDelta).toFixed(2),
        positions,
        orders: [order, ...prev.orders].slice(0, 100),
      };
    });
  }, [addAlert]);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

  return {
    stocks,
    selectedStock,
    selectedSymbol,
    setSelectedSymbol,
    timeframe,
    setTimeframe,
    portfolio,
    executeTrade,
    alerts,
  };
}
