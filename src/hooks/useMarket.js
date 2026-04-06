import { useState, useEffect, useRef, useCallback } from 'react';
import { STOCKS, generateHistoricalData, TIMEFRAMES } from '../data/stocks';
import { loadPortfolio, savePortfolio } from '../utils/auth';
import { checkAlerts } from '../utils/alerts';

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
    history: {},
    marketImpact: 0,
  }));
}

function initPortfolio(userId) {
  if (userId) {
    const saved = loadPortfolio(userId);
    if (saved) return { balance: saved.balance, positions: saved.positions || {}, orders: saved.orders || [], pnl: 0 };
  }
  return { balance: INITIAL_BALANCE, positions: {}, orders: [], pnl: 0 };
}

export function useMarket(user) {
  const userId = user?.id;
  const [stocks, setStocks] = useState(initMarket);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1D');
  const [portfolio, setPortfolio] = useState(() => initPortfolio(userId));
  const [alerts, setAlerts] = useState([]);  // toast notifications
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;
  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;

  // Re-init portfolio when user changes
  useEffect(() => {
    setPortfolio(initPortfolio(userId));
  }, [userId]);

  // Pre-generate all history
  useEffect(() => {
    setStocks(prev => prev.map(s => {
      const history = {};
      TIMEFRAMES.forEach(tf => {
        history[tf.label] = generateHistoricalData(s.price, s.volatility, tf.count, tf.ms);
      });
      return { ...s, history };
    }));
  }, []);

  // Market tick
  useEffect(() => {
    const tfObj = TIMEFRAMES.find(t => t.label === timeframe) || TIMEFRAMES[5];
    const interval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const vol = s.volatility;
        const meanReversion = (s.price - s.currentPrice) / s.price * 0.08;
        const impact = s.marketImpact * 0.002;
        const rand = (Math.random() - 0.499) * vol;
        const changeFactor = 1 + rand + meanReversion + impact;
        const newPrice = Math.max(0.01, +(s.currentPrice * changeFactor).toFixed(2));
        const change = +(newPrice - s.price).toFixed(2);
        const changePct = +((change / s.price) * 100).toFixed(2);
        const spread = newPrice * 0.0002;

        const updatedHistory = { ...s.history };
        if (updatedHistory[timeframe]?.length > 0) {
          const candles = [...updatedHistory[timeframe]];
          const last = { ...candles[candles.length - 1] };
          last.close = newPrice;
          last.high = Math.max(last.high, newPrice);
          last.low = Math.min(last.low, newPrice);
          last.volume += Math.floor(Math.random() * 5000);
          candles[candles.length - 1] = last;

          const nowSec = Math.floor(Date.now() / 1000);
          if (nowSec - last.time > tfObj.ms / 1000) {
            candles.push({ time: nowSec, open: newPrice, high: newPrice, low: newPrice, close: newPrice, volume: Math.floor(Math.random() * 50000) });
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
          marketImpact: s.marketImpact * 0.92,
        };
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [timeframe]);

  // PnL recalculation
  useEffect(() => {
    setPortfolio(prev => {
      let unrealizedPnl = 0;
      Object.entries(prev.positions).forEach(([sym, pos]) => {
        const stock = stocksRef.current.find(s => s.symbol === sym);
        if (stock && pos.shares > 0) unrealizedPnl += (stock.currentPrice - pos.avgCost) * pos.shares;
      });
      return { ...prev, pnl: +unrealizedPnl.toFixed(2) };
    });
  }, [stocks]);

  // Check price alerts on each tick
  useEffect(() => {
    if (!userId) return;
    const { triggered } = checkAlerts(userId, stocksRef.current);
    triggered.forEach(a => {
      const label = { above: '▲ Price Above', below: '▼ Price Below', stop_loss: '🛑 Stop Loss', take_profit: '🎯 Take Profit' }[a.type] || a.type;
      addAlert(`${label} triggered: ${a.symbol} @ $${a.triggeredAt.toFixed(2)} (target $${a.price})`, a.type === 'stop_loss' ? 'error' : a.type === 'take_profit' ? 'success' : 'warning');
    });
  }, [stocks, userId]);

  // Auto-save portfolio
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => {
      const p = portfolioRef.current;
      const totalEquity = p.balance + Object.entries(p.positions).reduce((sum, [sym, pos]) => {
        const stock = stocksRef.current.find(s => s.symbol === sym);
        return sum + (stock ? stock.currentPrice * pos.shares : pos.avgCost * pos.shares);
      }, 0);
      savePortfolio(userId, { ...p, equity: +totalEquity.toFixed(2), totalPnl: +(totalEquity - INITIAL_BALANCE).toFixed(2) });
    }, 2000);
    return () => clearTimeout(timer);
  }, [portfolio, userId]);

  const addAlert = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setAlerts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 4000);
  }, []);

  const executeTrade = useCallback((symbol, side, quantity) => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { addAlert('Invalid quantity', 'error'); return; }

    setStocks(prev => prev.map(s => {
      if (s.symbol !== symbol) return s;
      const impactDir = side === 'buy' ? 1 : -1;
      const impactMag = (qty * s.currentPrice) / 500000;
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
        if (existing.shares < qty) { addAlert(`Not enough shares (have ${existing.shares})`, 'error'); return prev; }
        realizedPnl = +((price - existing.avgCost) * qty).toFixed(2);
        newShares = +(existing.shares - qty).toFixed(4);
        newAvgCost = existing.avgCost;
        balanceDelta = total;
        addAlert(`✓ Sold ${qty} ${symbol} @ $${price} | P&L: ${realizedPnl >= 0 ? '+' : ''}$${realizedPnl}`, realizedPnl >= 0 ? 'success' : 'warning');
      }

      if (newShares <= 0) delete positions[symbol];
      else positions[symbol] = { shares: newShares, avgCost: newAvgCost };

      const order = { id: Date.now(), time: new Date().toLocaleTimeString(), symbol, side, qty, price, total: +total.toFixed(2), realizedPnl };
      return { ...prev, balance: +(prev.balance + balanceDelta).toFixed(2), positions, orders: [order, ...prev.orders].slice(0, 100) };
    });
  }, [addAlert]);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

  return { stocks, selectedStock, selectedSymbol, setSelectedSymbol, timeframe, setTimeframe, portfolio, executeTrade, alerts };
}
