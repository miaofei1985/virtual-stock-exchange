import React, { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function TradePanel({ stock, portfolio, executeTrade, placePendingOrder }) {
  const { t } = useLang();
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

  const triggerLabel = orderType === 'limit'
    ? (side === 'buy' ? t('buyBelowPrice') : t('sellAbovePrice'))
    : (side === 'buy' ? t('buyAbovePrice') : t('sellBelowPrice'));

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      <div className="px-3 py-2 border-b text-xs uppercase tracking-widest font-semibold"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        {t('trade')}
      </div>

      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--bg-hover)' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-bright)' }}>{stock.symbol}</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{stock.name}</span>
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
        <div className="flex justify-between mt-1.5">
          <div className="text-center">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('bid')}</div>
            <div className="text-sm font-mono price-up">{stock.bid.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('spread')}</div>
            <div className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{(stock.ask - stock.bid).toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('ask')}</div>
            <div className="text-sm font-mono price-down">{stock.ask.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--bg-hover)' }}>
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <button className={`flex-1 py-1.5 text-xs font-bold transition-all min-h-[44px] ${side === 'buy' ? 'bg-up text-white' : ''}`}
            style={side !== 'buy' ? { color: 'var(--text-secondary)' } : {}}
            onClick={() => setSide('buy')}>{t('buy')}</button>
          <button className={`flex-1 py-1.5 text-xs font-bold transition-all min-h-[44px] ${side === 'sell' ? 'bg-down text-white' : ''}`}
            style={side !== 'sell' ? { color: 'var(--text-secondary)' } : {}}
            onClick={() => setSide('sell')}>{t('sell')}</button>
        </div>
      </div>

      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--bg-hover)' }}>
        <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{t('orderType')}</label>
        <div className="flex gap-1">
          {[{v:'market',l:t('market')},{v:'limit',l:t('limit')},{v:'stop',l:t('stop')}].map(ty => (
            <button key={ty.v}
              className={`flex-1 py-1 text-xs font-bold rounded transition-all min-h-[44px]`}
              style={orderType === ty.v
                ? { background: 'var(--bg-hover)', color: 'var(--text-bright)', border: '1px solid var(--border-light)' }
                : { background: 'var(--bg-panel)', color: 'var(--text-secondary)', border: '1px solid transparent' }}
              onClick={() => setOrderType(ty.v)}>{ty.l}</button>
          ))}
        </div>
        {orderType !== 'market' && (
          <div className="mt-1.5">
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{triggerLabel}</label>
            <input className="input-dark" type="number" min="0" step="0.01" value={triggerPrice}
              onChange={e => setTriggerPrice(e.target.value)} placeholder={stock.currentPrice.toFixed(2)} />
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--bg-hover)' }}>
        <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{t('quantity')}</label>
        <input className="input-dark" type="number" min="0" step="1" value={qty}
          onChange={e => setQty(e.target.value)} placeholder="0" />
        <div className="flex gap-1 mt-1.5">
          {[{p:0.25,l:t('pct25')},{p:0.5,l:t('pct50')},{p:0.75,l:t('pct75')},{p:1,l:t('pct100')}].map(b => (
            <button key={b.p} className="flex-1 text-xs py-0.5 rounded min-h-[44px]"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
              onClick={() => setQtyPct(b.p)}>{b.l}</button>
          ))}
        </div>
        {parsedQty > 0 && (
          <div className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('total')}: <span style={{ color: 'var(--text-bright)' }} className="font-mono">${total.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        <button className={side === 'buy' ? 'btn-buy w-full' : 'btn-sell w-full'}
          onClick={handleTrade} disabled={!parsedQty || (orderType !== 'market' && !triggerPrice)}>
          {orderType === 'market' ? (side === 'buy' ? `▲ ${t('buy')}` : `▼ ${t('sell')}`) : `📋 ${orderType === 'limit' ? t('limit') : t('stop')} ${side === 'buy' ? t('buy') : t('sell')}`} {stock.symbol}
        </button>
      </div>

      {position && position.shares > 0 && (
        <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--bg-hover)', background: 'var(--bg-panel)' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('openPosition')}</div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>{t('shares')}:</span>
            <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{position.shares}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span style={{ color: 'var(--text-secondary)' }}>{t('avgCost')}:</span>
            <span className="font-mono" style={{ color: 'var(--text-bright)' }}>${position.avgCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span style={{ color: 'var(--text-secondary)' }}>{t('value')}:</span>
            <span className="font-mono" style={{ color: 'var(--text-bright)' }}>${positionValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span style={{ color: 'var(--text-secondary)' }}>{t('unrPnl')}:</span>
            <span className={`font-mono font-bold ${positionPnl >= 0 ? 'price-up' : 'price-down'}`}>
              {positionPnl >= 0 ? '+' : ''}${positionPnl.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="px-3 py-2 border-t mt-auto" style={{ borderColor: 'var(--bg-hover)' }}>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>{t('cashBalance')}:</span>
          <span className="font-mono" style={{ color: 'var(--text-bright)' }}>${portfolio.balance.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs mt-0.5">
          <span style={{ color: 'var(--text-muted)' }}>{t('unrealizedPnl')}:</span>
          <span className={`font-mono ${portfolio.pnl >= 0 ? 'price-up' : 'price-down'}`}>
            {portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
