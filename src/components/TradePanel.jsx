import React, { useState } from 'react';

export default function TradePanel({ stock, portfolio, executeTrade, placePendingOrder }) {
  const [qty, setQty] = useState('');
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [triggerPrice, setTriggerPrice] = useState('');

  if (!stock) return null;

  const price = side === 'buy' ? stock.ask : stock.bid;
  const parsedQty = parseFloat(qty) || 0;
  const total = +(price * parsedQty).toFixed(2);
  const position = portfolio.positions[stock.symbol];
  const positionValue = position ? +(position.shares * stock.currentPrice).toFixed(2) : 0;
  const positionPnl = position ? +((stock.currentPrice - position.avgCost) * position.shares).toFixed(2) : 0;

  const handleTrade = () => {
    if (orderType === 'market') {
      executeTrade(stock.symbol, side, parsedQty);
    } else {
      const type = `${orderType}_${side}`;
      placePendingOrder(stock.symbol, type, parsedQty, parseFloat(triggerPrice));
    }
    setQty('');
    setTriggerPrice('');
  };

  const setQtyPct = (pct) => {
    if (side === 'buy') {
      const maxShares = Math.floor(portfolio.balance * pct / stock.ask * 100) / 100;
      setQty(String(maxShares > 0 ? maxShares : ''));
    } else if (position) {
      setQty(String(+(position.shares * pct).toFixed(2)));
    }
  };

  return (
    <div className="flex flex-col bg-dark-800 h-full">
      <div className="px-3 py-2 border-b border-dark-500 text-xs text-gray-400 uppercase tracking-widest font-semibold">
        Trade
      </div>

      {/* Symbol info */}
      <div className="px-3 py-2 border-b border-dark-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-sm">{stock.symbol}</span>
            <span className="text-gray-500 text-xs ml-2">{stock.name}</span>
          </div>
          <div className="text-right">
            <div className={`font-mono font-bold text-sm ${stock.changePct >= 0 ? 'price-up' : 'price-down'}`}>
              ${stock.currentPrice.toFixed(2)}
            </div>
            <div className={`text-xs font-mono ${stock.changePct >= 0 ? 'price-up' : 'price-down'}`}>
              {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
            </div>
          </div>
        </div>
        {/* Bid/Ask */}
        <div className="flex justify-between mt-1.5">
          <div className="text-center">
            <div className="text-xs text-gray-500">BID</div>
            <div className="text-sm font-mono price-up">{stock.bid.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">SPREAD</div>
            <div className="text-sm font-mono text-gray-400">{(stock.ask - stock.bid).toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">ASK</div>
            <div className="text-sm font-mono price-down">{stock.ask.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Side selector */}
      <div className="px-3 py-2 border-b border-dark-600">
        <div className="flex rounded overflow-hidden border border-dark-400">
          <button className={`flex-1 py-1.5 text-xs font-bold transition-all ${side === 'buy' ? 'bg-up text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setSide('buy')}>BUY</button>
          <button className={`flex-1 py-1.5 text-xs font-bold transition-all ${side === 'sell' ? 'bg-down text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setSide('sell')}>SELL</button>
        </div>
      </div>

      {/* Order type */}
      <div className="px-3 py-2 border-b border-dark-600">
        <label className="text-xs text-gray-500 block mb-1">Order Type</label>
        <div className="flex gap-1">
          {[{v:'market',l:'Market'},{v:'limit',l:'Limit'},{v:'stop',l:'Stop'}].map(t => (
            <button key={t.v}
              className={`flex-1 py-1 text-xs font-bold rounded transition-all ${orderType === t.v ? 'bg-dark-500 text-white border border-dark-300' : 'bg-dark-700 text-gray-400 hover:text-white border border-transparent'}`}
              onClick={() => setOrderType(t.v)}>{t.l}</button>
          ))}
        </div>
        {orderType !== 'market' && (
          <div className="mt-1.5">
            <label className="text-xs text-gray-500 block mb-1">
              {orderType === 'limit' ? (side === 'buy' ? 'Buy below price' : 'Sell above price') : (side === 'buy' ? 'Buy above price' : 'Sell below price')}
            </label>
            <input className="input-dark" type="number" min="0" step="0.01" value={triggerPrice}
              onChange={e => setTriggerPrice(e.target.value)} placeholder={stock.currentPrice.toFixed(2)} />
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="px-3 py-2 border-b border-dark-600">
        <label className="text-xs text-gray-500 block mb-1">Quantity (shares)</label>
        <input className="input-dark" type="number" min="0" step="1" value={qty}
          onChange={e => setQty(e.target.value)} placeholder="0" />
        <div className="flex gap-1 mt-1.5">
          {[0.25, 0.5, 0.75, 1].map(p => (
            <button key={p} className="flex-1 text-xs py-0.5 bg-dark-600 hover:bg-dark-500 text-gray-400 rounded"
              onClick={() => setQtyPct(p)}>{p * 100}%</button>
          ))}
        </div>
        {parsedQty > 0 && (
          <div className="mt-1.5 text-xs text-gray-400">
            Total: <span className="text-white font-mono">${total.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Execute */}
      <div className="px-3 py-2">
        <button className={side === 'buy' ? 'btn-buy w-full' : 'btn-sell w-full'}
          onClick={handleTrade} disabled={!parsedQty || (orderType !== 'market' && !triggerPrice)}>
          {orderType === 'market' ? (side === 'buy' ? '▲ BUY' : '▼ SELL') : `📋 ${orderType.toUpperCase()} ${side.toUpperCase()}`} {stock.symbol}
        </button>
      </div>

      {/* Position info */}
      {position && position.shares > 0 && (
        <div className="px-3 py-2 border-t border-dark-600 bg-dark-700">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Open Position</div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Shares:</span>
            <span className="text-white font-mono">{position.shares}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span className="text-gray-400">Avg Cost:</span>
            <span className="text-white font-mono">${position.avgCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span className="text-gray-400">Value:</span>
            <span className="text-white font-mono">${positionValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span className="text-gray-400">Unr. P&L:</span>
            <span className={`font-mono font-bold ${positionPnl >= 0 ? 'price-up' : 'price-down'}`}>
              {positionPnl >= 0 ? '+' : ''}${positionPnl.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Balance */}
      <div className="px-3 py-2 border-t border-dark-600 mt-auto">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Cash Balance:</span>
          <span className="text-white font-mono">${portfolio.balance.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs mt-0.5">
          <span className="text-gray-500">Unrealized P&L:</span>
          <span className={`font-mono ${portfolio.pnl >= 0 ? 'price-up' : 'price-down'}`}>
            {portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
