import { useState, useEffect, useRef, useCallback } from 'react';
import { STOCKS, generateHistoricalData, TIMEFRAMES } from '../data/stocks';
import { loadPortfolio, savePortfolio } from '../utils/auth';
import { useWebSocket } from './useWebSocket';
import { api } from '../utils/api';

const INITIAL_BALANCE = 1000000;

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

export { INITIAL_BALANCE };

export function useMarket(user) {
  const userId = user?.id;
  const [stocks, setStocks] = useState(initMarket);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1D');
  const [portfolio, setPortfolio] = useState(() => initPortfolio(userId));
  const [alerts, setAlerts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;
  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;
  const addAlertRef = useRef(null);

  // WebSocket connection
  const { connected: wsConnected, stocks: wsStocks } = useWebSocket();

  // Re-init portfolio when user changes — fetch from backend first
  useEffect(() => {
    if (!userId) {
      setPortfolio({ balance: INITIAL_BALANCE, positions: {}, orders: [], pnl: 0 });
      return;
    }
    // Try backend first, fallback to localStorage
    api.getPortfolio()
      .then(data => {
        const positions = {};
        (data.positions || []).forEach(p => {
          positions[p.symbol] = { shares: p.shares, avgCost: p.avg_cost };
        });
        const orders = (data.orders || []).map(o => ({
          id: o.id, time: new Date(o.created_at * 1000).toLocaleTimeString(),
          symbol: o.symbol, side: o.side, qty: o.quantity,
          price: o.price, total: o.total, realizedPnl: o.realized_pnl,
        }));
        const portfolio = {
          balance: data.portfolio.balance,
          positions,
          orders,
          pnl: 0,
        };
        setPortfolio(portfolio);
        // Cache to localStorage
        savePortfolio(userId, { ...portfolio, equity: data.portfolio.equity, totalPnl: data.portfolio.total_pnl });
      })
      .catch(() => {
        // Backend unavailable — use localStorage fallback
        setPortfolio(initPortfolio(userId));
      });
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

  // Merge WebSocket market data into local stocks
  useEffect(() => {
    if (!wsStocks || wsStocks.length === 0) return;
    setStocks(prev => prev.map(local => {
      const remote = wsStocks.find(s => s.symbol === local.symbol);
      if (!remote) return local;
      const updatedHistory = { ...local.history };
      if (updatedHistory[timeframe]?.length > 0) {
        const candles = [...updatedHistory[timeframe]];
        const last = { ...candles[candles.length - 1] };
        last.close = remote.currentPrice;
        last.high = Math.max(last.high, remote.currentPrice);
        last.low = Math.min(last.low, remote.currentPrice);
        last.volume = remote.volume || last.volume;
        candles[candles.length - 1] = last;
        updatedHistory[timeframe] = candles;
      }
      return {
        ...local,
        currentPrice: remote.currentPrice,
        prevPrice: remote.prevPrice || local.prevPrice,
        change: remote.change,
        changePct: remote.changePct,
        bid: remote.bid,
        ask: remote.ask,
        volume: remote.volume,
        marketImpact: remote.marketImpact || 0,
        history: updatedHistory,
      };
    }));
  }, [wsStocks, timeframe]);

  // Market tick (fallback when WebSocket disconnected)
  useEffect(() => {
    if (wsConnected) return;
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
  }, [timeframe, wsConnected]);

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

  const addAlert = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setAlerts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 4000);
  }, []);

  // Keep ref current for use in effects
  addAlertRef.current = addAlert;

  // Poll server alerts: detect triggered ones by comparing with previous state
  const prevAlertIdsRef = useRef(new Set());
  useEffect(() => {
    if (!userId) return;
    const checkAlertChanges = async () => {
      try {
        const activeAlerts = await api.getAlerts();
        const currentIds = new Set(activeAlerts.map(a => a.id));
        if (prevAlertIdsRef.current.size > 0) {
          for (const prevId of prevAlertIdsRef.current) {
            if (!currentIds.has(prevId)) {
              addAlertRef.current?.(`🔔 Price alert triggered!`, 'warning');
            }
          }
        }
        prevAlertIdsRef.current = currentIds;
      } catch {}
    };
    checkAlertChanges();
    const interval = setInterval(checkAlertChanges, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Backend handles pending order execution — frontend only displays them
  useEffect(() => {
    if (!userId) return;
    const syncPendingOrders = async () => {
      try {
        const serverOrders = await api.getPendingOrders();
        setPendingOrders(serverOrders.map(o => ({
          id: o.id,
          symbol: o.symbol,
          type: o.type,
          quantity: o.quantity,
          triggerPrice: o.trigger_price,
          time: new Date(o.created_at * 1000).toLocaleTimeString(),
        })));
      } catch {}
    };
    syncPendingOrders();
    const interval = setInterval(syncPendingOrders, 3000);
    return () => clearInterval(interval);
  }, [userId]);

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

  const placePendingOrder = useCallback(async (symbol, type, quantity, triggerPrice) => {
    const qty = parseFloat(quantity);
    const tp = parseFloat(triggerPrice);
    if (!qty || qty <= 0 || !tp || tp <= 0) { addAlert('Invalid order parameters', 'error'); return; }
    try {
      await api.placePendingOrder(symbol, type, qty, tp);
      const label = type.replace('_', ' ').toUpperCase();
      addAlert(`📋 ${label} placed: ${qty} ${symbol} @ $${tp}`, 'success');
      // Refresh from server
      const serverOrders = await api.getPendingOrders();
      setPendingOrders(serverOrders.map(o => ({
        id: o.id, symbol: o.symbol, type: o.type, quantity: o.quantity,
        triggerPrice: o.trigger_price, time: new Date(o.created_at * 1000).toLocaleTimeString(),
      })));
    } catch (err) {
      addAlert(`Failed to place order: ${err.message}`, 'error');
    }
  }, [addAlert]);

  const cancelPendingOrder = useCallback(async (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) addAlert(`🗑 Order cancelled: ${order.type?.replace('_',' ').toUpperCase()} ${order.quantity} ${order.symbol}`, 'warning');
    try {
      await api.cancelPendingOrder(orderId);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch {}
  }, [addAlert, pendingOrders]);

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

      // Sync trade to backend API
      api.trade(symbol, side, qty, price).catch(() => {});

      return { ...prev, balance: +(prev.balance + balanceDelta).toFixed(2), positions, orders: [order, ...prev.orders].slice(0, 100) };
    });
  }, [addAlert]);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

  return { stocks, selectedStock, selectedSymbol, setSelectedSymbol, timeframe, setTimeframe, portfolio, executeTrade, alerts, pendingOrders, placePendingOrder, cancelPendingOrder };
}
